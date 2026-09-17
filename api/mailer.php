<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Servicio de Envío de Correos Transaccionales (SMTP Directo / Gmail)
 * Fundación Educativa Esquel (Escuela N.º 1030 / 1739)
 */

function getSmtpConfig(): array {
    $envFile = __DIR__ . '/env.php';
    $env = is_readable($envFile) ? (require $envFile) : [];

    return [
        'host'      => $env['SMTP_HOST'] ?? 'smtp.gmail.com',
        'port'      => (int)($env['SMTP_PORT'] ?? 587),
        'user'      => $env['SMTP_USER'] ?? 'noresponder.fee@gmail.com',
        'pass'      => $env['SMTP_PASS'] ?? '', // Contraseña de aplicación de 16 caracteres
        'from_name' => $env['SMTP_FROM_NAME'] ?? 'Fundación Educativa Esquel',
        'from_mail' => $env['SMTP_FROM_EMAIL'] ?? ($env['SMTP_USER'] ?? 'noresponder.fee@gmail.com'),
        'secure'    => $env['SMTP_SECURE'] ?? 'tls', // 'tls' (587) o 'ssl' (465)
    ];
}

/**
 * Cliente SMTP Socket ligero y sin dependencias externas
 */
function sendSmtpEmail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): array {
    $config = getSmtpConfig();

    if (empty($config['pass'])) {
        error_log("[MAILER] SMTP omitido: SMTP_PASS no configurado en api/env.php");
        return [
            'success' => false,
            'error'   => 'Credenciales SMTP de noresponder-fee@gmail.com no configuradas en el servidor.',
            'omitted' => true
        ];
    }

    $toEmail = trim($toEmail);
    if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => "Email de destino inválido: {$toEmail}"];
    }

    $timeout = 10;
    $host = $config['host'];
    $port = $config['port'];
    $isSsl = ($config['secure'] === 'ssl' || $port === 465);

    $remote = ($isSsl ? 'ssl://' : '') . $host . ':' . $port;
    $socket = @stream_socket_client($remote, $errno, $errstr, $timeout);

    if (!$socket) {
        $msg = "[MAILER] Conexión SMTP fallida a {$remote}: {$errstr} ({$errno})";
        error_log($msg);
        return ['success' => false, 'error' => $msg];
    }

    stream_set_timeout($socket, $timeout);

    $read = function() use ($socket): string {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $response;
    };

    $write = function(string $cmd) use ($socket): void {
        fputs($socket, $cmd . "\r\n");
    };

    // 1. Saludo inicial del servidor
    $greet = $read();
    if (!str_starts_with($greet, '220')) {
        fclose($socket);
        return ['success' => false, 'error' => "Error saludo SMTP: {$greet}"];
    }

    // 2. EHLO
    $write("EHLO " . gethostname());
    $ehlo = $read();

    // 3. STARTTLS si no es SSL directo
    if (!$isSsl && ($config['secure'] === 'tls' || $port === 587)) {
        $write("STARTTLS");
        $tlsResp = $read();
        if (!str_starts_with($tlsResp, '220')) {
            fclose($socket);
            return ['success' => false, 'error' => "STARTTLS rechazado: {$tlsResp}"];
        }

        $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$crypto) {
            fclose($socket);
            return ['success' => false, 'error' => 'No se pudo negociar cifrado TLS con Gmail.'];
        }

        // Re-enviar EHLO post-TLS
        $write("EHLO " . gethostname());
        $ehlo = $read();
    }

    // 4. Autenticación AUTH LOGIN
    $write("AUTH LOGIN");
    $authResp = $read();
    if (!str_starts_with($authResp, '334')) {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN no soportado o rechazado: {$authResp}"];
    }

    $write(base64_encode($config['user']));
    $userResp = $read();
    if (!str_starts_with($userResp, '334')) {
        fclose($socket);
        return ['success' => false, 'error' => "Usuario SMTP rechazado: {$userResp}"];
    }

    $cleanPass = str_replace(' ', '', $config['pass']);
    $write(base64_encode($cleanPass));
    $passResp = $read();
    if (!str_starts_with($passResp, '235')) {
        fclose($socket);
        return ['success' => false, 'error' => "Contraseña SMTP incorrecta o App Password inválida: {$passResp}"];
    }

    // 5. MAIL FROM
    $write("MAIL FROM:<{$config['from_mail']}>");
    $fromResp = $read();
    if (!str_starts_with($fromResp, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "MAIL FROM rechazado: {$fromResp}"];
    }

    // 6. RCPT TO
    $write("RCPT TO:<{$toEmail}>");
    $rcptResp = $read();
    if (!str_starts_with($rcptResp, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "RCPT TO rechazado: {$rcptResp}"];
    }

    // 7. DATA
    $write("DATA");
    $dataResp = $read();
    if (!str_starts_with($dataResp, '354')) {
        fclose($socket);
        return ['success' => false, 'error' => "DATA rechazado: {$dataResp}"];
    }

    $boundary = "----=_Part_" . md5(uniqid((string)mt_rand(), true));

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encodedFromName = '=?UTF-8?B?' . base64_encode($config['from_name']) . '?=';
    $encodedToName   = !empty($toName) ? '=?UTF-8?B?' . base64_encode($toName) . '?=' : $toEmail;

    $headers = [
        "From: {$encodedFromName} <{$config['from_mail']}>",
        "To: {$encodedToName} <{$toEmail}>",
        "Reply-To: administracion@fundacionesquel.edu.ar",
        "Subject: {$encodedSubject}",
        "MIME-Version: 1.0",
        "Date: " . date('r'),
        "Message-ID: <" . md5(uniqid((string)mt_rand(), true)) . "@fundacionesquel.edu.ar>",
        "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
        "X-Mailer: FEE-Aulas-Mailer/1.0"
    ];

    if (empty($textBody)) {
        $textBody = strip_tags(str_replace(['<br>', '<p>', '</div>'], ["\n", "\n\n", "\n"], $htmlBody));
    }

    $body = implode("\r\n", $headers) . "\r\n\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($textBody)) . "\r\n";

    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";

    $body .= "--{$boundary}--\r\n";
    $body .= ".";

    $write($body);
    $sendResp = $read();

    $write("QUIT");
    $read();
    fclose($socket);

    if (str_starts_with($sendResp, '250')) {
        return ['success' => true, 'message' => 'Correo despachado exitosamente.'];
    }

    return ['success' => false, 'error' => "Error al enviar cuerpo de mensaje: {$sendResp}"];
}

/**
 * Plantilla HTML institucional para invitación a formalización de matrícula
 */
function sendFormalizationInviteEmail(array $student, string $token, string $baseUrl = 'https://fundacionesquel.edu.ar'): array {
    $studentName   = htmlspecialchars($student['studentName'] ?? 'el/la aspirante');
    $studentGrade  = htmlspecialchars($student['studentGrade'] ?? 'el curso solicitado');
    $studentSchool = htmlspecialchars($student['school'] ?? 'Fundación Educativa Esquel');
    $parentName    = htmlspecialchars($student['parent1Name'] ?? ($student['tutorName'] ?? 'Estimada Familia'));
    $parentEmail   = trim($student['parent1Email'] ?? ($student['tutorEmail'] ?? ''));

    if (empty($parentEmail)) {
        return ['success' => false, 'error' => 'El aspirante no tiene un email de contacto registrado.'];
    }

    $formalizationUrl = rtrim($baseUrl, '/') . "/formalizacion?token=" . urlencode($token);
    $subject = "Vacante Aprobada: Formalización de Matrícula 2027 - {$studentName}";

    $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Formalización de Matrícula - Fundación Educativa Esquel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">FUNDACIÓN EDUCATIVA ESQUEL</h1>
              <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">Escuela N.º 1030 (Inicial y Primario) · Escuela N.º 1739 (Secundario)</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
                ✓ Vacante Asignada & Confirmada
              </div>

              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">¡Nos alegra darles la bienvenida a la comunidad educativa!</h2>
              
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                Hola <strong>{$parentName}</strong>, nos comunicamos desde la Dirección y el Área de Admisiones para informarles que la solicitud de vacante para <strong>{$studentName}</strong> ha sido <strong>aprobada</strong> para el Ciclo Lectivo 2027 en <strong>{$studentGrade}</strong> ({$studentSchool}).
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  <strong>Paso final para asegurar la vacante:</strong><br>
                  Para formalizar la matrícula e incorporar definitivamente a {$studentName} en la nómina oficial del aula, es necesario revisar los datos y firmar digitalmente el Contrato de Servicios Educativos.
                </p>
              </div>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{$formalizationUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
                      Firmar y Formalizar Matrícula 2027 →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; text-align: center; margin: 0 0 20px 0;">
                Este enlace es personal y exclusivo para su familia. Tiene una validez de 7 días corridos a partir de la recepción de este mensaje.
              </p>

              <p style="font-size: 11px; line-height: 1.4; color: #94a3b8; word-break: break-all; margin: 0;">
                Si el botón superior no funciona, podés copiar y pegar este enlace directamente en tu navegador:<br>
                <a href="{$formalizationUrl}" style="color: #0284c7;">{$formalizationUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Fundación Educativa Esquel · Esquel, Chubut, Patagonia Argentina<br>
                Consultas: administracion@fundacionesquel.edu.ar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

    return sendSmtpEmail($parentEmail, $parentName, $subject, $html);
}

/**
 * Plantilla HTML para notificación de Lista de Espera
 */
function sendWaitlistNoticeEmail(array $student, string $baseUrl = 'https://fundacionesquel.edu.ar'): array {
    $studentName   = htmlspecialchars($student['studentName'] ?? 'el/la aspirante');
    $studentGrade  = htmlspecialchars($student['studentGrade'] ?? 'el curso solicitado');
    $studentSchool = htmlspecialchars($student['school'] ?? 'Fundación Educativa Esquel');
    $parentName    = htmlspecialchars($student['parent1Name'] ?? ($student['tutorName'] ?? 'Estimada Familia'));
    $parentEmail   = trim($student['parent1Email'] ?? ($student['tutorEmail'] ?? ''));

    if (empty($parentEmail)) {
        return ['success' => false, 'error' => 'El aspirante no tiene un email de contacto registrado.'];
    }

    $subject = "Información sobre Solicitud de Vacante 2027 - {$studentName}";

    $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Admisiones 2027 - Fundación Educativa Esquel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">FUNDACIÓN EDUCATIVA ESQUEL</h1>
              <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px;">Escuela N.º 1030 · Escuela N.º 1739</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">Estado de la Solicitud para el Ciclo 2027</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                Hola <strong>{$parentName}</strong>, les agradecemos profundamente el interés y la confianza depositada en nuestro proyecto pedagógico para la escolaridad de <strong>{$studentName}</strong>.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                Queremos informarles que, debido a la capacidad máxima de aulas y la prioridad reglamentaria de alumnos regulares y hermanos, las vacantes inmediatas para <strong>{$studentGrade}</strong> ({$studentSchool}) se encuentran transitoriamente completas.
              </p>
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                  <strong>Nómina de Espera Prioritaria:</strong><br>
                  La postulación de {$studentName} queda registrada formalmente en nuestra nómina de espera. En caso de producirse bajas, traslados o modificaciones de cupo antes del inicio del ciclo lectivo, nos comunicaremos de inmediato con ustedes.
                </p>
              </div>
              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 24px 0 0 0;">
                Quedamos a su entera disposición ante cualquier consulta adicional.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Fundación Educativa Esquel · administracion@fundacionesquel.edu.ar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

    return sendSmtpEmail($parentEmail, $parentName, $subject, $html);
}
