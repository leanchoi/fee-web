<?php
require_once __DIR__ . '/config.php';

$token = getBearerToken();
$session = verifyToken($token);

if (!$session) {
    http_response_code(401);
    echo json_encode(["success" => false, "authenticated" => false, "error" => "No autorizado. Inicie sesión para continuar."]);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (!$action && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $bodyData = json_decode($rawInput, true);
    $action = $bodyData['action'] ?? '';
}

// 3 Noticias institucionales iniciales por defecto
$initialPosts = [
    [
        'id'        => 'post-1',
        'title'     => 'Inicio del Ciclo Lectivo 2026',
        'slug'      => 'inicio-ciclo-lectivo-2026',
        'category'  => 'Institucional',
        'excerpt'   => 'Comenzamos un nuevo año con la esperanza y el compromiso renovado de toda la comunidad educativa, recibiendo a las familias y nuevos ingresantes.',
        'content'   => 'Damos inicio a un nuevo año escolar con gran entusiasmo y el compromiso de siempre. Durante esta primera semana, las familias y estudiantes de los tres niveles compartieron las jornadas de bienvenida e integración pedagógica. Agradecemos a toda la comunidad por acompañarnos en este hermoso camino formativo.',
        'imageUrl'  => '/photos/fee_photo_07.jpg',
        'published' => 1,
        'createdAt' => '2026-02-26 10:00:00',
        'updatedAt' => '2026-02-26 10:00:00'
    ],
    [
        'id'        => 'post-2',
        'title'     => 'Cambridge English Acreditation',
        'slug'      => 'cambridge-english-acreditation',
        'category'  => 'Inglés',
        'excerpt'   => 'Felicitamos a los alumnos de 6to año que han obtenido su First Certificate con honores en las mesas internacionales de evaluación.',
        'content'   => 'Queremos hacer un reconocimiento especial a nuestros estudiantes de Nivel Secundario por su destacado desempeño en las certificaciones internacionales de Cambridge English (B2 First y C1 Advanced). Su dedicación y el acompañamiento del equipo docente de inglés demuestran la solidez de nuestro proyecto bilingüe.',
        'imageUrl'  => '/photos/fee_photo_12.jpg',
        'published' => 1,
        'createdAt' => '2026-03-14 10:00:00',
        'updatedAt' => '2026-03-14 10:00:00'
    ],
    [
        'id'        => 'post-3',
        'title'     => 'Kermesse Solidaria de Otoño',
        'slug'      => 'kermesse-solidaria-de-otono',
        'category'  => 'Comunidad',
        'excerpt'   => 'Invitamos a todas las familias al gran evento solidario del año en el SUM de la sede primaria para compartir juegos, buffet y proyectos comunitarios.',
        'content'   => 'El próximo sábado nos encontramos toda la comunidad de la Fundación Educativa Esquel para celebrar nuestra tradicional Kermesse de Otoño. Habrá stands recreativos organizados por los cursos, buffet solidario a beneficio de proyectos estudiantiles y presentaciones artísticas. ¡Los esperamos a todos!',
        'imageUrl'  => '/photos/fee_photo_14.jpg',
        'published' => 1,
        'createdAt' => '2026-04-02 10:00:00',
        'updatedAt' => '2026-04-02 10:00:00'
    ]
];

switch ($action) {
    // 1. Obtener todos los datos para el Dashboard
    case 'get_dashboard_data':
    case 'get_data':
        $enrollments = [];
        $contacts    = [];
        $posts       = [];
        $users       = [];

        // Leer datos desde MySQL
        try {
            $pdo = getPDO();
            if ($pdo) {
                $enrollments = $pdo->query("SELECT * FROM `Enrollment` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                $contacts    = $pdo->query("SELECT * FROM `ContactMessage` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                $posts       = $pdo->query("SELECT * FROM `Post` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                
                if ($session['role'] === 'SUPER_ADMIN') {
                    $users = $pdo->query("SELECT `id`, `email`, `name`, `role`, `permissions`, `createdAt` FROM `User` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                }
            }
        } catch (Exception $e) {
            // MySQL error handled gracefully
        }

        // Combinar con almacenamiento JSON de respaldo
        $dataDir = __DIR__ . '/data';
        $enrollFile = $dataDir . '/enrollments.json';
        if (file_exists($enrollFile)) {
            $jsonEnrollments = json_decode(file_get_contents($enrollFile), true) ?: [];
            $existingIds = array_column($enrollments, 'id');
            foreach ($jsonEnrollments as $item) {
                if (!in_array($item['id'], $existingIds)) {
                    $enrollments[] = $item;
                }
            }
        }

        $contactFile = $dataDir . '/contacts.json';
        if (file_exists($contactFile)) {
            $jsonContacts = json_decode(file_get_contents($contactFile), true) ?: [];
            $existingIds = array_column($contacts, 'id');
            foreach ($jsonContacts as $item) {
                if (!in_array($item['id'], $existingIds)) {
                    $contacts[] = $item;
                }
            }
        }

        // Si no hay posts en base de datos, mostrar los 3 posts iniciales
        if (empty($posts)) {
            $posts = $initialPosts;
        }

        echo json_encode([
            "success"     => true,
            "user"        => $session,
            "enrollments" => $enrollments,
            "contacts"    => $contacts,
            "posts"       => $posts,
            "users"       => $users
        ]);
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

        // Actualizar en JSON
        $enrollFile = __DIR__ . '/data/enrollments.json';
        if (file_exists($enrollFile)) {
            $items = json_decode(file_get_contents($enrollFile), true) ?: [];
            foreach ($items as &$it) {
                if ($it['id'] === $id) {
                    $it['status'] = $status;
                }
            }
            @file_put_contents($enrollFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        try {
            $pdo = getPDO();
            if ($pdo) {
                $stmt = $pdo->prepare("UPDATE `Enrollment` SET `status` = :status WHERE `id` = :id");
                $stmt->execute([':status' => $status, ':id' => $id]);
            }
        } catch (Exception $e) {}

        echo json_encode(["success" => true]);
        break;

    // 3. Eliminar inscripción
    case 'delete_enrollment':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }

        $enrollFile = __DIR__ . '/data/enrollments.json';
        if (file_exists($enrollFile)) {
            $items = json_decode(file_get_contents($enrollFile), true) ?: [];
            $items = array_values(array_filter($items, fn($it) => $it['id'] !== $id));
            @file_put_contents($enrollFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        try {
            $pdo = getPDO();
            if ($pdo) {
                $stmt = $pdo->prepare("DELETE FROM `Enrollment` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (Exception $e) {}

        echo json_encode(["success" => true]);
        break;

    // 4. Eliminar mensaje de contacto
    case 'delete_contact':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }

        $contactFile = __DIR__ . '/data/contacts.json';
        if (file_exists($contactFile)) {
            $items = json_decode(file_get_contents($contactFile), true) ?: [];
            $items = array_values(array_filter($items, fn($it) => $it['id'] !== $id));
            @file_put_contents($contactFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        try {
            $pdo = getPDO();
            if ($pdo) {
                $stmt = $pdo->prepare("DELETE FROM `ContactMessage` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (Exception $e) {}

        echo json_encode(["success" => true]);
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
            $pdo = getPDO();
            if ($pdo) {
                if ($id && strpos($id, 'post-') !== 0) {
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
            }
        } catch (Exception $e) {}

        echo json_encode(["success" => true]);
        break;

    // 6. Eliminar Post
    case 'delete_post':
        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        try {
            $pdo = getPDO();
            if ($pdo && $id) {
                $stmt = $pdo->prepare("DELETE FROM `Post` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (Exception $e) {}

        echo json_encode(["success" => true]);
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
