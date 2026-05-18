<?php
/**
 * Hajari AI proxy endpoint
 * POST JSON: { "prompt": "..." }
 * Reads config from ../config/ai_config.php and forwards to selected provider.
 * Returns JSON: { success: bool, text: "..." }
 */

// Allow CORS from local frontend (adjust as needed)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    // adjust this origin check to match your dev host
    if (in_array($origin, ['http://127.0.0.1:8000', 'http://localhost:8000', 'http://127.0.0.1'])) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
}
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

$body = file_get_contents('php://input');
$data = json_decode($body, true);
if (!$data || !isset($data['prompt'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing prompt']);
    exit;
}

$prompt = trim($data['prompt']);

$cfgPath = __DIR__ . '/../config/ai_config.php';
if (!file_exists($cfgPath)) {
    echo json_encode(['success' => false, 'error' => 'AI config file not found on server. Create ssms-backend/config/ai_config.php']);
    exit;
}

$cfg = include $cfgPath;
if (!is_array($cfg) || empty($cfg['provider'])) {
    echo json_encode(['success' => false, 'error' => 'AI provider not configured. Edit config to set provider and key.']);
    exit;
}

try {
    if ($cfg['provider'] === 'openai') {
        if (empty($cfg['openai_key'])) throw new Exception('OpenAI key missing');
        $apiKey = $cfg['openai_key'];
        $payload = [
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => "You are Hajari, an assistant that analyzes admin KPIs, gives concise action items, and returns Arabic or English depending on the prompt. Keep answers short and actionable."],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 600,
            'temperature' => 0.2,
        ];

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $resp = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($err) throw new Exception('HTTP request failed: ' . $err);
        $j = json_decode($resp, true);
        $text = null;
        if (isset($j['choices'][0]['message']['content'])) {
            $text = $j['choices'][0]['message']['content'];
        } elseif (isset($j['choices'][0]['text'])) {
            $text = $j['choices'][0]['text'];
        }
        if ($text === null) throw new Exception('Unexpected OpenAI response');
        echo json_encode(['success' => true, 'text' => $text]);
        exit;

    } elseif ($cfg['provider'] === 'google') {
        if (empty($cfg['google_api_key'])) throw new Exception('Google API key missing');
        $apiKey = $cfg['google_api_key'];
        // Use Google Generative AI REST endpoint (models may vary). Example for text generation:
        $url = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=' . urlencode($apiKey);
        $payload = [
            'prompt' => [ 'text' => $prompt ],
            'temperature' => 0.2,
            'maxOutputTokens' => 600,
        ];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [ 'Content-Type: application/json' ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $resp = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($err) throw new Exception('HTTP request failed: ' . $err);
        $j = json_decode($resp, true);
        if (isset($j['candidates'][0]['output'])) {
            echo json_encode(['success' => true, 'text' => $j['candidates'][0]['output']]);
            exit;
        }
        throw new Exception('Unexpected Google response');

    } else {
        throw new Exception('Unsupported AI provider configured');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
