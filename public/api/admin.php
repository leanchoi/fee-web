<?php
// ==============================================================================
// PANEL DE ADMINISTRACIÓN SEGURO - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

// 12 Tarjetas oficiales preexistentes de la galería Home
$initialGallery = [
    [
        'id'       => 'gal-1',
        'image'    => '/photos/fee_photo_21.jpg',
        'category' => 'Salidas Educativas',
        'title'    => 'Exploración en los Bosques Andinos',
        'desc'     => 'Caminatas y salidas de estudio en contacto con la flora y fauna nativa de la región.',
        'order'    => 1
    ],
    [
        'id'       => 'gal-2',
        'image'    => '/photos/fee_photo_12.jpg',
        'category' => 'Inglés & Teatro',
        'title'    => 'English Concert & Drama Festival',
        'desc'     => 'Obras teatrales y musicales íntegramente en inglés sobre el escenario.',
        'order'    => 2
    ],
    [
        'id'       => 'gal-3',
        'image'    => '/photos/fee_photo_24.jpg',
        'category' => 'Campamentos & Convivencia',
        'title'    => 'Jornadas Recreativas en la Naturaleza',
        'desc'     => 'Campamentos anuales y picnics formativos para afianzar vínculos y compañerismo.',
        'order'    => 3
    ],
    [
        'id'       => 'gal-4',
        'image'    => '/photos/fee_photo_07.jpg',
        'category' => 'Identidad & Valores',
        'title'    => 'Compromiso Cívico e Institucional',
        'desc'     => 'Nuestros abanderados y escoltas portando los símbolos de la escuela y la bandera patria.',
        'order'    => 4
    ],
    [
        'id'       => 'gal-5',
        'image'    => '/photos/fee_photo_14.jpg',
        'category' => 'Comunidad de Familias',
        'title'    => 'Kermesse y Encuentros Solidarios',
        'desc'     => 'El gimnasio colmado de familias en celebraciones y proyectos cooperativos.',
        'order'    => 5
    ],
    [
        'id'       => 'gal-6',
        'image'    => '/photos/fee_photo_09.jpg',
        'category' => 'Tecnología & Innovación',
        'title'    => 'Robótica y Pensamiento Digital',
        'desc'     => 'Alumnos experimentando con proyectos digitales y herramientas informáticas en el aula.',
        'order'    => 6
    ],
    [
        'id'       => 'gal-7',
        'image'    => '/photos/fee_photo_06.jpg',
        'category' => 'Ciencias Naturales',
        'title'    => 'Inmersión Científica en Instituto Balseiro',
        'desc'     => 'Salidas de estudio a centros de investigación nuclear (CNEA RA-6) y laboratorios avanzados.',
        'order'    => 7
    ],
    [
        'id'       => 'gal-8',
        'image'    => '/photos/fee_photo_15.jpg',
        'category' => 'Nivel Inicial',
        'title'    => 'Juego y Socialización en el Patio',
        'desc'     => 'Jornadas de descubrimiento y contención afectiva en las salas de 3, 4 y 5 años.',
        'order'    => 8
    ],
    [
        'id'       => 'gal-9',
        'image'    => '/photos/fee_photo_22.jpg',
        'category' => 'Certificaciones',
        'title'    => 'Acreditaciones Internacionales Cambridge',
        'desc'     => 'Entrega de diplomas y reconocimiento al mérito académico en idioma inglés.',
        'order'    => 9
    ],
    [
        'id'       => 'gal-10',
        'image'    => '/photos/fee_photo_20.jpg',
        'category' => 'Vida al Aire Libre',
        'title'    => 'Navegación y Campamentos en Lagos Andinos',
        'desc'     => 'Experiencias de travesía y aprendizaje en contacto con el agua y la montaña.',
        'order'    => 10
    ],
    [
        'id'       => 'gal-11',
        'image'    => '/photos/fee_photo_10.jpg',
        'category' => 'Cultura y Lengua',
        'title'    => 'Feria del Libro en Inglés (Book Fair)',
        'desc'     => 'Fomento del hábito lector y exploración de literatura bilingüe en biblioteca.',
        'order'    => 11
    ],
    [
        'id'       => 'gal-12',
        'image'    => '/photos/fee_photo_08.jpg',
        'category' => 'Nivel Secundario',
        'title'    => 'Colación y Fiesta de Egresados',
        'desc'     => 'Cierre de ciclo formativo y celebración del futuro de nuestros estudiantes.',
        'order'    => 12
    ]
];

// Endpoint público para obtener fotos de la galería Home
if (($_GET['action'] ?? '') === 'get_gallery') {
    $galleryFile = __DIR__ . '/data/gallery.json';
    $items = [];
    if (file_exists($galleryFile)) {
        $items = json_decode(file_get_contents($galleryFile), true) ?: [];
    }
    if (empty($items)) {
        $items = $initialGallery;
        if (!is_dir(__DIR__ . '/data')) {
            @mkdir(__DIR__ . '/data', 0755, true);
        }
        @file_put_contents($galleryFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    jsonResponse(200, ["success" => true, "gallery" => $items]);
}

// Función auxiliar para auto-generar la estructura estática del post para Apache/Hostinger
function ensureBlogPostDirectory($slug) {
    if (empty($slug) || preg_match('/[^a-zA-Z0-9_-]/', $slug)) return;
    $rootDir = dirname(__DIR__);
    $targetDir = $rootDir . '/blog/' . $slug;
    $templateDir = $rootDir . '/blog/_post';
    if (!is_dir($templateDir)) {
        $templateDir = $rootDir . '/blog/cambridge-english-acreditation';
    }
    if (!is_dir($templateDir)) {
        $templateDir = $rootDir . '/blog/inicio-ciclo-lectivo-2026';
    }
    if (!is_dir($targetDir) && is_dir($templateDir)) {
        @mkdir($targetDir, 0755, true);
        $copyRecursive = function($src, $dst) use (&$copyRecursive) {
            $dir = @opendir($src);
            if (!$dir) return;
            @mkdir($dst, 0755, true);
            while (false !== ($file = readdir($dir))) {
                if (($file != '.') && ($file != '..')) {
                    if (is_dir($src . '/' . $file)) {
                        $copyRecursive($src . '/' . $file, $dst . '/' . $file);
                    } else {
                        @copy($src . '/' . $file, $dst . '/' . $file);
                    }
                }
            }
            closedir($dir);
        };
        $copyRecursive($templateDir, $targetDir);
    }
}

// Endpoint público para obtener noticias / posts del Blog (visibles en Home y /blog sin requerir login)
if (($_GET['action'] ?? '') === 'get_posts') {
    $posts = [];
    $pdo = getPDO();
    if ($pdo) {
        try {
            $reqSlug = trim($_GET['slug'] ?? '');
            if (!empty($reqSlug)) {
                $stmt = $pdo->prepare("SELECT * FROM `Post` WHERE `slug` = :slug LIMIT 1");
                $stmt->execute([':slug' => $reqSlug]);
                $foundPost = $stmt->fetch();
                if ($foundPost) {
                    ensureBlogPostDirectory($foundPost['slug'] ?? '');
                    jsonResponse(200, ["success" => true, "post" => $foundPost]);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM `Post` WHERE `published` = 1 ORDER BY `createdAt` DESC");
                $posts = $stmt->fetchAll() ?: [];
            }
        } catch (Exception $e) {
            error_log("Public get_posts DB error: " . $e->getMessage());
        }
    }

    // Si la base de datos no arrojó resultados o falló, consultar archivo JSON de respaldo
    if (empty($posts)) {
        $postsFile = __DIR__ . '/data/posts.json';
        if (file_exists($postsFile)) {
            $jsonPosts = json_decode(file_get_contents($postsFile), true);
            if (is_array($jsonPosts)) {
                $reqSlug = trim($_GET['slug'] ?? '');
                if (!empty($reqSlug)) {
                    foreach ($jsonPosts as $p) {
                        if (($p['slug'] ?? '') === $reqSlug) {
                            ensureBlogPostDirectory($p['slug'] ?? '');
                            jsonResponse(200, ["success" => true, "post" => $p]);
                        }
                    }
                } else {
                    $posts = array_values(array_filter($jsonPosts, function($p) {
                        return !isset($p['published']) || !empty($p['published']);
                    }));
                }
            }
        }
    }

    // Asegurar carpetas para todos los posts publicados
    if (!empty($posts)) {
        foreach ($posts as $p) {
            if (!empty($p['slug'])) {
                ensureBlogPostDirectory($p['slug']);
            }
        }
    }

    // Si se pidió un slug específico y no se encontró
    $reqSlug = trim($_GET['slug'] ?? '');
    if (!empty($reqSlug)) {
        jsonResponse(404, ["success" => false, "error" => "Post no encontrado"]);
    }

    jsonResponse(200, ["success" => true, "posts" => $posts]);
}

// Permitir logout directo aún si el token estuviera expirado
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    clearSessionCookie();
    jsonResponse(200, ["success" => true, "message" => "Sesión cerrada"]);
}

$session = requireAuth();

// Inicializar variables de entrada de forma segura
$bodyData = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $bodyData = json_decode($rawInput, true) ?: [];
    }
}

$action = $_GET['action'] ?? ($bodyData['action'] ?? ($_POST['action'] ?? ''));

// Verificador de permisos granular del lado del servidor
function checkPermission($session, $requiredPerm) {
    if (($session['role'] ?? '') === 'SUPER_ADMIN') {
        return true;
    }
    $userPerms = array_map('trim', explode(',', $session['permissions'] ?? ''));
    return in_array($requiredPerm, $userPerms, true);
}

// 3 Noticias institucionales iniciales (deshabilitadas para no resucitar posts borrados)
$initialPosts = [];

switch ($action) {
    // 1. Obtener todos los datos para el Dashboard (Filtrado por permisos)
    case 'get_dashboard_data':
    case 'get_data':
        $enrollments = [];
        $contacts    = [];
        $posts       = [];
        $users       = [];
        $gallery     = [];
        $cohorts     = [];

        $canEnrollments = checkPermission($session, 'enrollments');
        $canContacts    = checkPermission($session, 'contacts');
        $canBlog        = checkPermission($session, 'blog');
        $isSuperAdmin   = ($session['role'] ?? '') === 'SUPER_ADMIN';
        $filterCohort   = isset($_GET['cohort']) ? (int)$_GET['cohort'] : null;

        try {
            $pdo = getPDO();
            if ($pdo) {
                if ($canEnrollments) {
                    try {
                        if ($filterCohort && $filterCohort > 2020) {
                            $stmtEn = $pdo->prepare("SELECT * FROM `Enrollment` WHERE `cohortYear` = :cohort ORDER BY `createdAt` DESC");
                            $stmtEn->execute([':cohort' => $filterCohort]);
                            $enrollments = $stmtEn->fetchAll() ?: [];
                        } else {
                            $enrollments = $pdo->query("SELECT * FROM `Enrollment` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                        }
                    } catch (Exception $e) {}

                    try {
                        $cohorts = $pdo->query("SELECT `id`, `year`, `type`, `status`, `notes` FROM `Cohort` ORDER BY `year` DESC, `type` ASC")->fetchAll() ?: [];
                    } catch (Exception $e) {
                        $cohorts = [];
                    }
                }
                if ($canContacts) {
                    try {
                        $contacts = $pdo->query("SELECT * FROM `ContactMessage` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                    } catch (Exception $e) {}
                }
                if ($canBlog) {
                    try {
                        $posts = $pdo->query("SELECT * FROM `Post` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                    } catch (Exception $e) {}
                }
                if ($isSuperAdmin) {
                    try {
                        ensureUserTableSchema($pdo);
                        $users = $pdo->query("SELECT `id`, `username`, `email`, `name`, `role`, `permissions`, `mustChangePassword`, `createdAt` FROM `User` ORDER BY `createdAt` DESC")->fetchAll() ?: [];
                    } catch (Exception $e) {
                        error_log("Get users DB error: " . $e->getMessage());
                    }
                }
                if (!empty($session['userId'])) {
                    try {
                        $stmtUser = $pdo->prepare("SELECT `mustChangePassword`, `username`, `name` FROM `User` WHERE `id` = :uid LIMIT 1");
                        $stmtUser->execute([':uid' => $session['userId']]);
                        $freshUser = $stmtUser->fetch();
                        if ($freshUser) {
                            $session['mustChangePassword'] = !empty($freshUser['mustChangePassword']);
                            if (!empty($freshUser['username'])) $session['username'] = $freshUser['username'];
                            if (!empty($freshUser['name'])) $session['name'] = $freshUser['name'];
                        }
                    } catch (Exception $e) {}
                }
            }
        } catch (Exception $e) {
            error_log("Dashboard query error: " . $e->getMessage());
        }

        // Combinar con almacenamiento JSON de respaldo para todos los módulos
        $dataDir = __DIR__ . '/data';
        
        if ($isSuperAdmin) {
            $usersFile = $dataDir . '/users.json';
            $jsonUsers = file_exists($usersFile) ? (json_decode(file_get_contents($usersFile), true) ?: []) : [];
            
            // Garantizar la presencia de usuarios institucionales mínimos
            if (empty($jsonUsers)) {
                $jsonUsers = [
                    [
                        'id'                 => 'fee-super-admin-01',
                        'username'           => 'admin',
                        'email'              => 'admin@fundacionesquel.edu.ar',
                        'name'               => 'Administrador FEE',
                        'role'               => 'SUPER_ADMIN',
                        'permissions'        => 'blog,contacts,enrollments,users,gallery',
                        'mustChangePassword' => 0,
                        'createdAt'          => '2026-02-15 10:00:00'
                    ],
                    [
                        'id'                 => 'fee-user-mar-01',
                        'username'           => 'mar',
                        'email'              => 'mar@fee.local',
                        'name'               => 'Marina Caselli',
                        'role'               => 'EDITOR',
                        'permissions'        => 'blog,enrollments,contacts',
                        'mustChangePassword' => 1,
                        'createdAt'          => '2026-08-20 14:00:00'
                    ]
                ];
                if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
                @file_put_contents($usersFile, json_encode($jsonUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }

            $existingUserIds = array_column($users, 'id');
            $existingUsernames = array_map('strtolower', array_column($users, 'username'));

            foreach ($jsonUsers as $ju) {
                $juId = $ju['id'] ?? '';
                $juUsername = strtolower($ju['username'] ?? '');
                if (!in_array($juId, $existingUserIds) && !in_array($juUsername, $existingUsernames)) {
                    $cleanUser = [
                        'id'                 => $juId ?: generateUUID(),
                        'username'           => $ju['username'] ?? 'usuario',
                        'email'              => $ju['email'] ?? ($ju['username'] . '@fee.local'),
                        'name'               => $ju['name'] ?? $ju['username'],
                        'role'               => $ju['role'] ?? 'EDITOR',
                        'permissions'        => $ju['permissions'] ?? 'blog,enrollments,contacts',
                        'mustChangePassword' => !empty($ju['mustChangePassword']) ? 1 : 0,
                        'createdAt'          => $ju['createdAt'] ?? date('Y-m-d H:i:s')
                    ];
                    $users[] = $cleanUser;
                    $existingUserIds[] = $cleanUser['id'];
                    $existingUsernames[] = strtolower($cleanUser['username']);
                }
            }
        }
        if ($canEnrollments) {
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

            $preFile = $dataDir . '/preinscripciones.json';
            if (file_exists($preFile)) {
                $jsonPres = json_decode(file_get_contents($preFile), true) ?: [];
                $existingIds = array_column($enrollments, 'id');
                foreach ($jsonPres as $item) {
                    if (!in_array($item['id'], $existingIds)) {
                        $enrollments[] = $item;
                    }
                }
            }
        }

        if ($canContacts) {
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
        }

        if ($canBlog) {
            $postsFile = $dataDir . '/posts.json';
            if (file_exists($postsFile)) {
                $jsonPosts = json_decode(file_get_contents($postsFile), true) ?: [];
                $existingIds = array_column($posts, 'id');
                foreach ($jsonPosts as $item) {
                    if (!in_array($item['id'], $existingIds)) {
                        $posts[] = $item;
                    }
                }
            }
        }

        // Cargar galería de fotos
        $galleryFile = $dataDir . '/gallery.json';
        if (file_exists($galleryFile)) {
            $gallery = json_decode(file_get_contents($galleryFile), true) ?: [];
        }
        if (empty($gallery)) {
            $gallery = $initialGallery;
        }

        $sessionPayload = [
            "userId"             => $session['userId'] ?? '',
            "username"           => $session['username'] ?? '',
            "name"               => $session['name'] ?? '',
            "email"              => $session['email'] ?? '',
            "role"               => $session['role'] ?? '',
            "permissions"        => $session['permissions'] ?? '',
            "mustChangePassword" => !empty($session['mustChangePassword'])
        ];

        jsonResponse(200, [
            "success"      => true,
            "enrollments"  => $enrollments,
            "cohorts"      => $cohorts,
            "contacts"     => $contacts,
            "posts"        => $posts,
            "users"        => $users,
            "gallery"      => $gallery,
            "session"      => $sessionPayload,
            "user"         => $sessionPayload
        ]);

    // 2. Actualizar estado de admisión (individual o masivo)
    case 'update_admission_status':
        if (!checkPermission($session, 'enrollments')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $ids = $bodyData['ids'] ?? (!empty($bodyData['id']) ? [$bodyData['id']] : []);
        $admissionStatus = trim($bodyData['admissionStatus'] ?? '');
        $admissionNotes  = trim($bodyData['admissionNotes'] ?? '');
        $decidedBy       = $session['name'] ?? ($session['username'] ?? 'admin');

        $allowedStatuses = ['recibida', 'entrevista_agendada', 'entrevista_realizada', 'admitida', 'lista_espera', 'no_admitida', 'desistida'];
        if (empty($ids) || !in_array($admissionStatus, $allowedStatuses, true)) {
            jsonResponse(400, ["success" => false, "error" => "Parámetros inválidos o estado de admisión no permitido"]);
        }

        try {
            $pdo = getPDO();
            if ($pdo) {
                $inClause = implode(',', array_fill(0, count($ids), '?'));
                $params = array_merge([$admissionStatus, $admissionNotes, $decidedBy], $ids);
                $stmt = $pdo->prepare("
                    UPDATE `Enrollment` 
                    SET `admissionStatus` = ?, 
                        `admissionNotes` = COALESCE(NULLIF(?, ''), `admissionNotes`), 
                        `decidedBy` = ?, 
                        `decidedAt` = NOW(3)
                    WHERE `id` IN ($inClause)
                ");
                $stmt->execute($params);
            }
        } catch (Exception $e) {
            jsonResponse(500, ["success" => false, "error" => $e->getMessage()]);
        }

        jsonResponse(200, ["success" => true, "updatedCount" => count($ids)]);

    // 2b. Verificar prioridad de aspirante
    case 'verify_priority':
        if (!checkPermission($session, 'enrollments')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id = trim($bodyData['id'] ?? '');
        $priorityVerified = !empty($bodyData['priorityVerified']) ? 1 : 0;

        if (empty($id)) {
            jsonResponse(400, ["success" => false, "error" => "ID de trámite requerido"]);
        }

        try {
            $pdo = getPDO();
            if ($pdo) {
                $stmt = $pdo->prepare("UPDATE `Enrollment` SET `priorityVerified` = :v WHERE `id` = :id");
                $stmt->execute([':v' => $priorityVerified, ':id' => $id]);
            }
        } catch (Exception $e) {
            jsonResponse(500, ["success" => false, "error" => $e->getMessage()]);
        }

        jsonResponse(200, ["success" => true]);
    case 'update_enrollment_status':
        if (!checkPermission($session, 'enrollments')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id     = trim($bodyData['id'] ?? ($_POST['id'] ?? ''));
        $status = strtoupper(trim($bodyData['status'] ?? ($_POST['status'] ?? '')));
        
        $allowedStatuses = ['PENDING', 'REVIEWED', 'CONTACTED'];
        if (!$id || !in_array($status, $allowedStatuses, true)) {
            jsonResponse(400, ["success" => false, "error" => "Parámetros inválidos o estado no permitido"]);
        }

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
        } catch (Exception $e) {
            error_log("Update enrollment error: " . $e->getMessage());
        }

        jsonResponse(200, ["success" => true]);

    // 3. Eliminar inscripción
    case 'delete_enrollment':
        if (!checkPermission($session, 'enrollments')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id = trim($bodyData['id'] ?? ($_POST['id'] ?? ''));
        if (!$id) {
            jsonResponse(400, ["success" => false, "error" => "ID requerido"]);
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
        } catch (Exception $e) {
            error_log("Delete enrollment error: " . $e->getMessage());
        }

        jsonResponse(200, ["success" => true]);

    // 4. Eliminar mensaje de contacto
    case 'delete_contact':
        if (!checkPermission($session, 'contacts')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id = trim($bodyData['id'] ?? ($_POST['id'] ?? ''));
        if (!$id) {
            jsonResponse(400, ["success" => false, "error" => "ID requerido"]);
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
        } catch (Exception $e) {
            error_log("Delete contact error: " . $e->getMessage());
        }

        jsonResponse(200, ["success" => true]);

    // 5. Guardar / Editar Post de Blog
    case 'save_post':
        if (!checkPermission($session, 'blog')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $title     = trim($bodyData['title'] ?? '');
        $slug      = trim($bodyData['slug'] ?? '');
        $content   = $bodyData['content'] ?? '';
        $excerpt   = trim($bodyData['excerpt'] ?? '');
        $imageUrl  = trim($bodyData['imageUrl'] ?? '');
        $category  = trim($bodyData['category'] ?? 'Novedades');
        $published = !empty($bodyData['published']) ? 1 : 0;
        $id        = $bodyData['id'] ?? '';

        if (empty($title) || empty($slug)) {
            jsonResponse(400, ["success" => false, "error" => "Título y slug son obligatorios"]);
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
        } catch (Exception $e) {
            error_log("Save post DB error: " . $e->getMessage());
        }

        // Sincronizar también con archivo JSON de respaldo
        $postsFile = __DIR__ . '/data/posts.json';
        $jsonPosts = [];
        if (file_exists($postsFile)) {
            $jsonPosts = json_decode(file_get_contents($postsFile), true);
            if (!is_array($jsonPosts)) $jsonPosts = [];
        }
        $targetId = $id ?: ($newId ?? generateUUID());
        $postRecord = [
            'id'        => $targetId,
            'title'     => $title,
            'slug'      => $slug,
            'content'   => $content,
            'excerpt'   => $excerpt,
            'imageUrl'  => $imageUrl,
            'category'  => $category,
            'published' => $published,
            'createdAt' => date('Y-m-d H:i:s'),
            'updatedAt' => date('Y-m-d H:i:s')
        ];
        $found = false;
        foreach ($jsonPosts as &$jp) {
            if (($jp['id'] ?? '') === $targetId || ($jp['slug'] ?? '') === $slug) {
                $postRecord['createdAt'] = $jp['createdAt'] ?? $postRecord['createdAt'];
                $jp = $postRecord;
                $found = true;
                break;
            }
        }
        if (!$found) {
            array_unshift($jsonPosts, $postRecord);
        }
        if (!is_dir(__DIR__ . '/data')) {
            @mkdir(__DIR__ . '/data', 0755, true);
        }
        @file_put_contents($postsFile, json_encode($jsonPosts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        jsonResponse(200, ["success" => true]);

    // 6. Eliminar Post
    case 'delete_post':
        if (!checkPermission($session, 'blog')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id = $bodyData['id'] ?? ($_POST['id'] ?? '');
        try {
            $pdo = getPDO();
            if ($pdo && $id) {
                $stmt = $pdo->prepare("DELETE FROM `Post` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (Exception $e) {
            error_log("Delete post DB error: " . $e->getMessage());
        }

        // Sincronizar eliminación en archivo JSON
        $postsFile = __DIR__ . '/data/posts.json';
        if (file_exists($postsFile)) {
            $jsonPosts = json_decode(file_get_contents($postsFile), true);
            if (is_array($jsonPosts)) {
                $jsonPosts = array_values(array_filter($jsonPosts, function($p) use ($id) {
                    return ($p['id'] ?? '') !== $id;
                }));
                @file_put_contents($postsFile, json_encode($jsonPosts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }
        }

        jsonResponse(200, ["success" => true]);

    // 7. Guardar / Editar Item de Galería de Fotos
    case 'save_gallery_item':
        if (!checkPermission($session, 'blog')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $galleryFile = __DIR__ . '/data/gallery.json';
        $items = [];
        if (file_exists($galleryFile)) {
            $items = json_decode(file_get_contents($galleryFile), true) ?: [];
        }

        $id       = trim($bodyData['id'] ?? '');
        $image    = trim($bodyData['image'] ?? '');
        $category = trim($bodyData['category'] ?? 'Experiencias');
        $title    = trim($bodyData['title'] ?? '');
        $desc     = trim($bodyData['desc'] ?? '');

        if (empty($image) || empty($title)) {
            jsonResponse(400, ["success" => false, "error" => "Imagen y título son requeridos"]);
        }

        $found = false;
        if ($id) {
            foreach ($items as &$it) {
                if ($it['id'] === $id) {
                    $it['image']    = $image;
                    $it['category'] = $category;
                    $it['title']    = $title;
                    $it['desc']     = $desc;
                    $found = true;
                    break;
                }
            }
        }

        if (!$found) {
            $items[] = [
                'id'       => $id ?: ('gal-' . time()),
                'image'    => $image,
                'category' => $category,
                'title'    => $title,
                'desc'     => $desc,
                'order'    => count($items) + 1
            ];
        }

        @file_put_contents($galleryFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        jsonResponse(200, ["success" => true, "gallery" => $items]);

    // 8. Eliminar Item de Galería de Fotos
    case 'delete_gallery_item':
        if (!checkPermission($session, 'blog')) {
            jsonResponse(403, ["success" => false, "error" => "Permisos insuficientes"]);
        }

        $id = trim($bodyData['id'] ?? ($_POST['id'] ?? ''));
        $galleryFile = __DIR__ . '/data/gallery.json';
        $items = [];
        if (file_exists($galleryFile)) {
            $items = json_decode(file_get_contents($galleryFile), true) ?: [];
            $items = array_values(array_filter($items, fn($it) => $it['id'] !== $id));
            @file_put_contents($galleryFile, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        jsonResponse(200, ["success" => true, "gallery" => $items]);

    // 9. Crear Usuario Gestor
    case 'create_user':
        if (($session['role'] ?? '') !== 'SUPER_ADMIN') {
            jsonResponse(403, ["success" => false, "error" => "Solo los Super Administradores pueden crear usuarios."]);
        }

        $rawUsername = trim($bodyData['username'] ?? '');
        $username    = strtolower(preg_replace('/[^a-zA-Z0-9_.-]/', '', $rawUsername));
        $name        = trim($bodyData['name'] ?? $username);
        $password    = trim($bodyData['password'] ?? '');
        $role        = strtoupper(trim($bodyData['role'] ?? 'EDITOR'));
        $permissions = trim($bodyData['permissions'] ?? 'blog');

        if (empty($username) || strlen($username) < 3) {
            jsonResponse(400, ["success" => false, "error" => "El nombre de usuario debe tener al menos 3 caracteres alfanuméricos."]);
        }
        if (empty($password) || strlen($password) < 6) {
            jsonResponse(400, ["success" => false, "error" => "La contraseña provisoria debe tener al menos 6 caracteres."]);
        }

        $newId = generateUUID();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $internalEmail = $username . '@fee.local';

        try {
            $pdo = getPDO();
            if ($pdo) {
                ensureUserTableSchema($pdo);
                $check = $pdo->prepare("SELECT `id` FROM `User` WHERE LOWER(COALESCE(username, '')) = :u OR LOWER(email) = :u2 LIMIT 1");
                $check->execute([':u' => $username, ':u2' => $internalEmail]);
                if ($check->fetch()) {
                    jsonResponse(400, ["success" => false, "error" => "El nombre de usuario '$username' ya existe."]);
                }

                $stmt = $pdo->prepare("
                    INSERT INTO `User` (`id`, `username`, `email`, `password`, `name`, `role`, `permissions`, `mustChangePassword`, `createdAt`, `updatedAt`)
                    VALUES (:id, :username, :email, :password, :name, :role, :permissions, 1, NOW(3), NOW(3))
                ");
                $stmt->execute([
                    ':id'          => $newId,
                    ':username'    => $username,
                    ':email'       => $internalEmail,
                    ':password'    => $hash,
                    ':name'        => $name,
                    ':role'        => $role,
                    ':permissions' => $permissions
                ]);
            }
        } catch (Exception $e) {
            error_log("Create user DB notice: " . $e->getMessage());
        }

        $usersFile = __DIR__ . '/data/users.json';
        $localUsers = file_exists($usersFile) ? (json_decode(file_get_contents($usersFile), true) ?: []) : [];
        $localUsers = array_filter($localUsers, fn($u) => strtolower($u['username'] ?? '') !== $username && strtolower($u['email'] ?? '') !== $internalEmail);
        $localUsers[] = [
            'id'                 => $newId,
            'username'           => $username,
            'email'              => $internalEmail,
            'password'           => $hash,
            'name'               => $name,
            'role'               => $role,
            'permissions'        => $permissions,
            'mustChangePassword' => 1,
            'createdAt'          => date('Y-m-d H:i:s'),
            'updatedAt'          => date('Y-m-d H:i:s')
        ];
        if (!is_dir(__DIR__ . '/data')) @mkdir(__DIR__ . '/data', 0755, true);
        @file_put_contents($usersFile, json_encode(array_values($localUsers), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        jsonResponse(200, ["success" => true, "message" => "Usuario '$username' creado correctamente."]);

    // 10. Eliminar Usuario
    case 'delete_user':
        if (($session['role'] ?? '') !== 'SUPER_ADMIN') {
            jsonResponse(403, ["success" => false, "error" => "Solo los Super Administradores pueden eliminar usuarios."]);
        }

        $id = trim($bodyData['id'] ?? ($_POST['id'] ?? ''));
        if ($id === 'fee-super-admin-01' || $id === ($session['userId'] ?? '')) {
            jsonResponse(400, ["success" => false, "error" => "No es posible eliminar el Administrador Principal o la cuenta activa."]);
        }

        try {
            $pdo = getPDO();
            if ($pdo && $id) {
                $stmt = $pdo->prepare("DELETE FROM `User` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
            }
        } catch (Exception $e) {
            error_log("Delete user DB notice: " . $e->getMessage());
        }

        $usersFile = __DIR__ . '/data/users.json';
        if (file_exists($usersFile)) {
            $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
            $localUsers = array_filter($localUsers, fn($u) => ($u['id'] ?? '') !== $id);
            @file_put_contents($usersFile, json_encode(array_values($localUsers), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        jsonResponse(200, ["success" => true]);

    // 10b. Resetear Contraseña de Usuario
    case 'reset_user_password':
        if (($session['role'] ?? '') !== 'SUPER_ADMIN') {
            jsonResponse(403, ["success" => false, "error" => "Solo los Super Administradores pueden resetear contraseñas."]);
        }

        $targetUserId = trim($bodyData['userId'] ?? '');
        $newPassword  = trim($bodyData['password'] ?? '');

        if (empty($targetUserId) || strlen($newPassword) < 6) {
            jsonResponse(400, ["success" => false, "error" => "ID de usuario y contraseña de al menos 6 caracteres requeridos."]);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        try {
            $pdo = getPDO();
            if ($pdo) {
                ensureUserTableSchema($pdo);
                $stmt = $pdo->prepare("
                    UPDATE `User` 
                    SET `password` = :password, `mustChangePassword` = 1, `updatedAt` = NOW(3)
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':password' => $newHash,
                    ':id'       => $targetUserId
                ]);
            }
        } catch (Exception $e) {
            error_log("Reset user password DB notice: " . $e->getMessage());
        }

        $usersFile = __DIR__ . '/data/users.json';
        if (file_exists($usersFile)) {
            $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
            foreach ($localUsers as &$lu) {
                if (($lu['id'] ?? '') === $targetUserId) {
                    $lu['password'] = $newHash;
                    $lu['mustChangePassword'] = 1;
                    $lu['updatedAt'] = date('Y-m-d H:i:s');
                }
            }
            @file_put_contents($usersFile, json_encode(array_values($localUsers), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        jsonResponse(200, ["success" => true, "message" => "Contraseña restablecida exitosamente."]);

    // 11. Cambiar Contraseña
    case 'change_password':
        $userId = $session['userId'] ?? '';
        $newPassword = (string)($bodyData['newPassword'] ?? ($bodyData['password'] ?? ''));

        if (empty($userId)) {
            jsonResponse(401, ["success" => false, "error" => "Sesión no válida"]);
        }
        if (strlen($newPassword) < 6) {
            jsonResponse(400, ["success" => false, "error" => "La nueva contraseña debe contener al menos 6 caracteres."]);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        try {
            $pdo = getPDO();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    UPDATE `User` 
                    SET `password` = :password, `mustChangePassword` = 0, `updatedAt` = NOW(3)
                    WHERE `id` = :id
                ");
                $stmt->execute([
                    ':password' => $newHash,
                    ':id'       => $userId
                ]);
            }
        } catch (Exception $e) {
            error_log("Change password DB notice: " . $e->getMessage());
        }

        $usersFile = __DIR__ . '/data/users.json';
        if (file_exists($usersFile)) {
            $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
            foreach ($localUsers as &$lu) {
                if (($lu['id'] ?? '') === $userId) {
                    $lu['password'] = $newHash;
                    $lu['mustChangePassword'] = 0;
                    $lu['updatedAt'] = date('Y-m-d H:i:s');
                }
            }
            @file_put_contents($usersFile, json_encode(array_values($localUsers), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        $session['mustChangePassword'] = false;
        $newToken = generateToken($session);
        setSessionCookie($newToken);

        jsonResponse(200, [
            "success" => true,
            "message" => "Contraseña actualizada exitosamente.",
            "token"   => $newToken,
            "user"    => $session
        ]);

    // 12. Cerrar Sesión
    case 'logout':
        clearSessionCookie();
        jsonResponse(200, ["success" => true]);

    default:
        jsonResponse(400, ["success" => false, "error" => "Acción no reconocida"]);
}
