<?php
/**
 * Main Router — Entry Point for All API Requests
 * ─────────────────────────────────────────────────
 * Every HTTP request hits this file (via .htaccess or direct URL).
 * It parses the URI into segments and dispatches to the correct controller.
 *
 * Key design decisions:
 *   • ob_start() captures stray PHP warnings so they never corrupt JSON.
 *   • set_error_handler converts warnings/notices into exceptions.
 *   • set_exception_handler is the last-resort JSON error response.
 *   • All segment access goes through seg() which returns null for missing indices.
 */

// ─── 1. Capture ALL output so stray warnings never break JSON ───
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');   // never render errors to browser
ini_set('log_errors', '1');

// ─── 2. Global error → exception converter ───
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;                 // honour @ suppression
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// ─── 3. Global exception handler (last resort — always returns JSON) ───
set_exception_handler(function (\Throwable $e): void {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => false,
        'error'   => [
            'code'    => 'SERVER_ERROR',
            'message' => (defined('DEBUG_MODE') && DEBUG_MODE)
                ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
                : 'Internal server error',
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
});

// ─── 4. Includes ───
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

require_once __DIR__ . '/../middleware/cors.php';   // CORS + JSON headers + exits on OPTIONS
require_once __DIR__ . '/../middleware/auth.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';
require_once __DIR__ . '/../utils/uploader.php';
require_once __DIR__ . '/../utils/logger.php';

Logger::logRequest();

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/StoneModel.php';
require_once __DIR__ . '/../models/CartModel.php';
require_once __DIR__ . '/../models/OrderModel.php';
require_once __DIR__ . '/../models/RequestModel.php';
require_once __DIR__ . '/../models/ReviewModel.php';
require_once __DIR__ . '/../models/NotificationModel.php';
require_once __DIR__ . '/../models/AuditModel.php';

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/StoneController.php';
require_once __DIR__ . '/../controllers/CartController.php';
require_once __DIR__ . '/../controllers/OrderController.php';
require_once __DIR__ . '/../controllers/RequestController.php';
require_once __DIR__ . '/../controllers/ReviewController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';
require_once __DIR__ . '/../controllers/AdminController.php';

// ─── 5. Parse request ───
$method = $_SERVER['REQUEST_METHOD'];
$uri    = strtok($_SERVER['REQUEST_URI'], '?');          // strip query string

// Strip the base path  e.g. /ssms-backend/public/api/auth/register → api/auth/register
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
if ($basePath !== '' && strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}
$uri = trim($uri, '/');

$segments = explode('/', $uri);

/**
 * Safe segment accessor — returns null when the index doesn't exist.
 * Eliminates every "Undefined array key" warning in the routing table.
 */
function seg(int $index): ?string {
    global $segments;
    return $segments[$index] ?? null;
}

Logger::debug('Router: parsed', ['method' => $method, 'uri' => $uri, 'segments' => $segments]);
Logger::addDebug('route_info', ['method' => $method, 'uri' => $uri, 'segments' => $segments]);

// ─── 6. Flush captured stray output before sending real JSON ───
ob_end_clean();

// ─── 7. Route dispatch ─────────────────────────────────────────
try {

    if (seg(0) !== 'api') {
        jsonNotFound('Invalid API endpoint');
    }

    $resource = seg(1);   // auth | stones | cart | orders | …

    // ================================================================
    //  DEBUG ROUTES  (only available when DEBUG_MODE is true)
    // ================================================================
    if ($resource === 'debug' && defined('DEBUG_MODE') && DEBUG_MODE) {

        if ($method === 'GET' && seg(2) === 'ping') {
            // Quick connectivity test
            try {
                $db   = Database::getInstance()->getConnection();
                $info = $db->query("SELECT VERSION() as version, DATABASE() as current_db")
                           ->fetch(PDO::FETCH_ASSOC);

                jsonResponse([
                    'php_version'       => PHP_VERSION,
                    'db_connected'      => true,
                    'db_server_version' => $info['version'],
                    'current_database'  => $info['current_db'],
                    'debug_mode'        => true,
                    'timestamp'         => date('Y-m-d H:i:s'),
                ], 'System status OK');
            } catch (PDOException $e) {
                Logger::error('Database ping failed', ['error' => $e->getMessage()]);
                jsonServerError('Database connection failed: ' . $e->getMessage());
            }

        } elseif ($method === 'GET' && seg(2) === 'db-check') {
            // Check every expected table
            try {
                $db = Database::getInstance()->getConnection();
                $tables = [
                    'users', 'customers', 'employees', 'stones',
                    'carts', 'cart_items', 'orders', 'order_details',
                    'order_status_history', 'custom_orders', 'reviews',
                    'notifications', 'audit_log',
                ];
                $results = [];
                $allOk   = true;
                foreach ($tables as $t) {
                    try {
                        $db->query("SELECT 1 FROM `{$t}` LIMIT 1");
                        $results[$t] = ['exists' => true, 'accessible' => true];
                    } catch (PDOException $e) {
                        $results[$t] = ['exists' => false, 'error' => $e->getMessage()];
                        $allOk = false;
                    }
                }
                jsonResponse([
                    'all_tables_ok' => $allOk,
                    'tables'        => $results,
                    'total_tables'  => count($tables),
                    'timestamp'     => date('Y-m-d H:i:s'),
                ], $allOk ? 'All database tables accessible' : 'Some tables have issues');
            } catch (PDOException $e) {
                jsonServerError('Database check failed: ' . $e->getMessage());
            }

        } else {
            jsonNotFound('Debug endpoint not found');
        }
    }

    // ================================================================
    //  AUTH ROUTES   POST /api/auth/register|login|logout   GET /api/auth/me
    // ================================================================
    elseif ($resource === 'auth') {
        $controller = new AuthController();
        $action     = seg(2);

        if      ($method === 'POST' && $action === 'register') { $controller->register(); }
        elseif  ($method === 'POST' && $action === 'login')    { $controller->login(); }
        elseif  ($method === 'POST' && $action === 'logout')   { $controller->logout(); }
        elseif  ($method === 'GET'  && $action === 'me')       { $controller->me(); }
        else    { jsonNotFound('Auth endpoint not found'); }
    }

    // ================================================================
    //  STONE ROUTES
    //    GET    /api/stones               → list all
    //    GET    /api/stones/{id}          → single stone
    //    GET    /api/stones/{id}/reviews  → reviews for a stone
    //    POST   /api/stones               → create  (admin)
    //    PUT    /api/stones/{id}          → update  (admin)
    //    DELETE /api/stones/{id}          → delete  (admin)
    //    POST   /api/stones/{id}/image    → upload  (admin)
    // ================================================================
    elseif ($resource === 'stones') {
        $controller = new StoneController();
        $stoneId    = seg(2);
        $sub        = seg(3);

        if ($method === 'GET' && $stoneId === null) {
            $controller->getAll();
        } elseif ($method === 'GET' && $stoneId !== null && $sub === 'reviews') {
            (new ReviewController())->getStoneReviews(intval($stoneId));
        } elseif ($method === 'GET' && $stoneId !== null) {
            $controller->getById(intval($stoneId));
        } elseif ($method === 'POST' && $stoneId === null) {
            $controller->create();
        } elseif ($method === 'POST' && $stoneId !== null && $sub === 'image') {
            $controller->uploadImage(intval($stoneId));
        } elseif ($method === 'PUT' && $stoneId !== null) {
            $controller->update(intval($stoneId));
        } elseif ($method === 'DELETE' && $stoneId !== null) {
            $controller->delete(intval($stoneId));
        } else {
            jsonNotFound('Stones endpoint not found');
        }
    }

    // ================================================================
    //  CART ROUTES
    //    GET    /api/cart                 → view cart
    //    POST   /api/cart   | /api/cart/add  → add item
    //    PUT    /api/cart/item/{id}       → update quantity
    //    DELETE /api/cart/item/{id}       → remove single item
    //    DELETE /api/cart                 → clear entire cart
    // ================================================================
    elseif ($resource === 'cart') {
        $controller = new CartController();
        $sub        = seg(2);
        $subId      = seg(3);

        if ($method === 'GET' && $sub === null) {
            $controller->getCart();
        }
        elseif ($method === 'POST' && ($sub === null || $sub === 'add')) {
            $controller->addItem();
        }
        elseif ($method === 'PUT' && $sub === 'item' && $subId !== null) {
            $controller->updateItem(intval($subId));
        }
        elseif ($method === 'DELETE' && $sub === 'item' && $subId !== null) {
            $controller->removeItem(intval($subId));
        }
        elseif ($method === 'DELETE' && $sub === null) {
            $controller->clearCart();
        }
        // Backward compat: PUT/DELETE /api/cart/{numeric_id}
        elseif ($method === 'PUT' && $sub !== null && is_numeric($sub)) {
            $controller->updateItem(intval($sub));
        }
        elseif ($method === 'DELETE' && $sub !== null && is_numeric($sub)) {
            $controller->removeItem(intval($sub));
        }
        else {
            jsonNotFound('Cart endpoint not found');
        }
    }

    // ================================================================
    //  CHECKOUT   POST /api/checkout
    // ================================================================
    elseif ($resource === 'checkout') {
        if ($method === 'POST') {
            (new OrderController())->checkout();
        } else {
            jsonNotFound('Checkout endpoint not found');
        }
    }

    // ================================================================
    //  ORDER ROUTES
    //    GET /api/orders            → list (scoped by role)
    //    GET /api/orders/{id}       → single order
    //    PUT /api/orders/{id}/status → update status
    // ================================================================
    elseif ($resource === 'orders') {
        $controller = new OrderController();
        $orderId    = seg(2);
        $sub        = seg(3);

        if ($method === 'GET' && $orderId === null) {
            $controller->getOrders();
        } elseif ($method === 'GET' && $orderId !== null && $sub === null) {
            $controller->getOrderById(intval($orderId));
        } elseif ($method === 'PUT' && $orderId !== null && $sub === 'status') {
            $controller->updateStatus(intval($orderId));
        } else {
            jsonNotFound('Orders endpoint not found');
        }
    }

    // ================================================================
    //  REQUEST ROUTES  (custom stone requests)
    //    POST /api/requests           → create
    //    GET  /api/requests           → list (scoped by role)
    //    GET  /api/requests/{id}      → single
    // ================================================================
    elseif ($resource === 'requests') {
        $controller = new RequestController();
        $reqId      = seg(2);

        if ($method === 'POST' && $reqId === null)    { $controller->create(); }
        elseif ($method === 'GET' && $reqId === null)  { $controller->getRequests(); }
        elseif ($method === 'GET' && $reqId !== null)   { $controller->getById(intval($reqId)); }
        else { jsonNotFound('Requests endpoint not found'); }
    }

    // ================================================================
    //  REVIEWS   POST /api/reviews
    // ================================================================
    elseif ($resource === 'reviews') {
        if ($method === 'POST') {
            (new ReviewController())->create();
        } else {
            jsonNotFound('Reviews endpoint not found');
        }
    }

    // ================================================================
    //  NOTIFICATION ROUTES
    //    GET /api/notifications               → list
    //    PUT /api/notifications/read-all       → mark all read
    //    PUT /api/notifications/{id}/read      → mark single read
    // ================================================================
    elseif ($resource === 'notifications') {
        $controller = new NotificationController();
        $nSeg2      = seg(2);
        $nSeg3      = seg(3);

        if ($method === 'GET' && $nSeg2 === null) {
            $controller->getNotifications();
        } elseif ($method === 'PUT' && $nSeg2 === 'read-all') {
            $controller->markAllAsRead();
        } elseif ($method === 'PUT' && $nSeg2 !== null && $nSeg3 === 'read') {
            $controller->markAsRead(intval($nSeg2));
        } else {
            jsonNotFound('Notifications endpoint not found');
        }
    }

    // ================================================================
    //  EMPLOYEE ROUTES
    //    GET /api/employee/orders   → employee's assigned orders
    // ================================================================
    elseif ($resource === 'employee') {
        if (seg(2) === 'orders' && $method === 'GET') {
            (new OrderController())->getOrders();
        } else {
            jsonNotFound('Employee endpoint not found');
        }
    }

    // ================================================================
    //  ADMIN ROUTES   /api/admin/…
    // ================================================================
    elseif ($resource === 'admin') {
        $controller  = new AdminController();
        $adminSub    = seg(2);   // orders | requests | audit-logs | users | employees
        $adminId     = seg(3);   // numeric id (or null)
        $adminAction = seg(4);   // assign | status | approve | reject | convert | reset-password

        // ── Admin > Orders ──
        if ($adminSub === 'orders') {
            if ($method === 'GET' && $adminId === null) {
                $controller->getAllOrders();
            } elseif ($method === 'PUT' && $adminId !== null && $adminAction === 'assign') {
                $controller->assignOrder(intval($adminId));
            } elseif ($method === 'PUT' && $adminId !== null && $adminAction === 'status') {
                $controller->updateOrderStatus(intval($adminId));
            } else {
                jsonNotFound('Admin orders endpoint not found');
            }
        }
        // ── Admin > Requests ──
        elseif ($adminSub === 'requests') {
            if ($method === 'GET' && $adminId === null) {
                $controller->getAllRequests();
            } elseif ($method === 'PUT' && $adminId !== null && $adminAction === 'approve') {
                $controller->approveRequest(intval($adminId));
            } elseif ($method === 'PUT' && $adminId !== null && $adminAction === 'reject') {
                $controller->rejectRequest(intval($adminId));
            } elseif ($method === 'POST' && $adminId !== null && $adminAction === 'convert') {
                $controller->convertRequest(intval($adminId));
            } else {
                jsonNotFound('Admin requests endpoint not found');
            }
        }
        // ── Admin > Audit Logs ──
        elseif ($adminSub === 'audit-logs') {
            if ($method === 'GET') {
                $controller->getAuditLogs();
            } else {
                jsonNotFound('Admin audit-logs endpoint not found');
            }
        }
        // ── Admin > Users ──
        elseif ($adminSub === 'users') {
            if ($method === 'GET' && $adminId === null) {
                $controller->getAllUsers();
            } elseif ($method === 'POST' && $adminId !== null && $adminAction === 'reset-password') {
                $controller->resetPassword(intval($adminId));
            } elseif ($method === 'PUT' && $adminId !== null && $adminAction === 'status') {
                $controller->updateUserStatus(intval($adminId));
            } else {
                jsonNotFound('Admin users endpoint not found');
            }
        }
        // ── Admin > Employees ──
        elseif ($adminSub === 'employees') {
            if ($method === 'POST' && $adminId === null) {
                $controller->createEmployee();
            } else {
                jsonNotFound('Admin employees endpoint not found');
            }
        }
        else {
            jsonNotFound('Admin endpoint not found');
        }
    }

    // ================================================================
    //  FALLBACK — no route matched
    // ================================================================
    else {
        Logger::addDebug('route_error', 'No matching route');
        jsonNotFound('Endpoint not found');
    }

} catch (PDOException $e) {
    Logger::error('Database error in router', [
        'error' => $e->getMessage(),
        'code'  => $e->getCode(),
        'file'  => $e->getFile(),
        'line'  => $e->getLine(),
    ]);
    jsonServerError('Database error: ' . (DEBUG_MODE ? $e->getMessage() : 'Please contact administrator'));

} catch (\Throwable $e) {
    Logger::error('Uncaught exception in router', [
        'error' => $e->getMessage(),
        'code'  => $e->getCode(),
        'file'  => $e->getFile(),
        'line'  => $e->getLine(),
    ]);
    jsonServerError('Server error: ' . (DEBUG_MODE ? $e->getMessage() : 'Please contact administrator'));
}
