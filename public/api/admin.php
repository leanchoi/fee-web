<?php
require_once __DIR__ . '/config.php';

$token = getBearerToken();
$session = verifyToken($token);

if (!$session) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "No autorizado. Sesión expirada o inválida."]);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (!$action && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $bodyData = json_decode($rawInput, true);
    $action = $bodyData['action'] ?? '';
}

switch ($action) {
    // 1. Obtener todos los datos para el Dashboard
    case 'get_dashboard_data':
    case 'get_data':
        try {
            $enrollments = $pdo->query("SELECT * FROM `Enrollment` ORDER BY `createdAt` DESC")->fetchAll();
            $contacts    = $pdo->query("SELECT * FROM `ContactMessage` ORDER BY `createdAt` DESC")->fetchAll();
            $posts       = $pdo->query("SELECT * FROM `Post` ORDER BY `createdAt` DESC")->fetchAll();
            $users       = [];
            
            if ($session['role'] === 'SUPER_ADMIN') {
                $users = $pdo->query("SELECT `id`, `email`, `name`, `role`, `permissions`, `createdAt` FROM `User` ORDER BY `createdAt` DESC")->fetchAll();
            }

            echo json_encode([
                "success"     => true,
                "user"        => $session,
                "enrollments" => $enrollments,
                "contacts"    => $contacts,
                "posts"       => $posts,
                "users"       => $users
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al obtener datos: " . $e->getMessage()]);
        }
        break;

    // 2. Actualizar estado de inscripción
    case 'update_enrollment_status':
        $id     = $bodyData['id'] ?? ($_POST['id'] ?? '');
        $status = $bodyData['status'] ?? ($_POST['status'] ?? '');
        
        if (!$id || !$status) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Parámetros incompletos"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE `Enrollment` SET `status` = :status WHERE `id` = :id");
            $stmt->execute([':status' => $status, ':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al actualizar estado"]);
        }
        break;

    // 3. Eliminar inscripción
    case 'delete_enrollment':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `Enrollment` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al eliminar inscripción"]);
        }
        break;

    // 4. Eliminar mensaje de contacto
    case 'delete_contact':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `ContactMessage` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al eliminar mensaje"]);
        }
        break;

    // 5. Guardar / Editar Post de Blog
    case 'save_post':
        $title     = trim($bodyData['title'] ?? '');
        $slug      = trim($bodyData['slug'] ?? '');
        $content   = $bodyData['content'] ?? '';
        $excerpt   = trim($bodyData['excerpt'] ?? '');
        $imageUrl  = trim($bodyData['imageUrl'] ?? '');
        $category  = trim($bodyData['category'] ?? 'Novedades');
        $published = !empty($bodyData['published']) ? 1 : 0;
        $id        = $bodyData['id'] ?? '';

        if (empty($title) || empty($slug)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Título y slug son obligatorios"]);
            exit;
        }

        try {
            if ($id) {
                // Actualizar
                $stmt = $pdo->prepare("
                    UPDATE `Post` SET `title` = :title, `slug` = :slug, `content` = :content, 
                    `excerpt` = :excerpt, `imageUrl` = :imageUrl, `category` = :category, 
                    `published` = :published, `updatedAt` = NOW(3)
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':title'     => $title,
                    ':slug'      => $slug,
                    ':content'   => $content,
                    ':excerpt'   => $excerpt,
                    ':imageUrl'  => $imageUrl,
                    ':category'  => $category,
                    ':published' => $published,
                    ':id'        => $id
                ]);
            } else {
                // Crear nuevo
                $newId = generateUUID();
                $stmt = $pdo->prepare("
                    INSERT INTO `Post` (`id`, `title`, `slug`, `content`, `excerpt`, `imageUrl`, `category`, `published`, `createdAt`, `updatedAt`)
                    VALUES (:id, :title, :slug, :content, :excerpt, :imageUrl, :category, :published, NOW(3), NOW(3))
                ");
                $stmt->execute([
                    ':id'        => $newId,
                    ':title'     => $title,
                    ':slug'      => $slug,
                    ':content'   => $content,
                    ':excerpt'   => $excerpt,
                    ':imageUrl'  => $imageUrl,
                    ':category'  => $category,
                    ':published' => $published
                ]);
            }
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al guardar publicación: " . $e->getMessage()]);
        }
        break;

    // 6. Eliminar Post
    case 'delete_post':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `Post` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al eliminar post"]);
        }
        break;

    // 7. Cerrar Sesión
    case 'logout':
        setcookie('admin_session', '', [
            'expires' => time() - 3600,
            'path'    => '/'
        ]);
        echo json_encode(["success" => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Acción no reconocida"]);
        break;
}
