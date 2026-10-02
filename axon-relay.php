<?php
/**
 * AXON CORE - Military-Grade Encrypted Relay (AES-256-CBC + HMAC-SHA256 + Anti-Replay)
 * مسیر قرارگیری در نت‌افراز: /domains/gate.axoncore.ir/public_html/axon-relay.php
 */
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Forbidden"]);
    exit;
}

$MASTER_SECRET = "AXON_AES256_HMAC_MASTER_KEY_2026_9F8E7D6C5B4A3F2E1D0C";
$binaryKey = hash("sha256", $MASTER_SECRET, true);

$rawInput = file_get_contents("php://input");
$envelope = json_decode($rawInput, true);

if (
    !$envelope ||
    empty($envelope["ts"]) ||
    empty($envelope["iv"]) ||
    empty($envelope["ct"]) ||
    empty($envelope["sig"])
) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Invalid Encrypted Envelope"]);
    exit;
}

$ts = strval($envelope["ts"]);
$ivB64 = strval($envelope["iv"]);
$ctB64 = strval($envelope["ct"]);
$providedSig = strval($envelope["sig"]);

// ۱. قفل زمانی ضد تکرار (Anti-Replay Protection: حداکثر ۶۰ ثانیه اعتبار برای هر بسته)
if (abs(time() - intval($ts)) > 60) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Expired Request Timestamp"]);
    exit;
}

// ۲. اعتبارسنجی امضای دیجیتال HMAC-SHA256 با مقایسه مقاوم در برابر حملات زمانی (Timing-Safe)
$expectedSig = hash_hmac("sha256", $ts . "." . $ivB64 . "." . $ctB64, $binaryKey);
if (!hash_equals($expectedSig, $providedSig)) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "HMAC Signature Verification Failed"]);
    exit;
}

// ۳. رمزگشایی بسته با الگوریتم AES-256-CBC
$ivBin = base64_decode($ivB64, true);
$ctBin = base64_decode($ctB64, true);
if ($ivBin === false || strlen($ivBin) !== 16 || $ctBin === false) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Malformed Cipher Parameters"]);
    exit;
}

$decryptedJson = openssl_decrypt($ctBin, "AES-256-CBC", $binaryKey, OPENSSL_RAW_DATA, $ivBin);
if ($decryptedJson === false) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Payload Decryption Failed"]);
    exit;
}

$reqData = json_decode($decryptedJson, true);
if (!$reqData || empty($reqData["targetUrl"])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Invalid Decrypted Payload"]);
    exit;
}

$targetUrl = trim($reqData["targetUrl"]);

// ۴. لیست سفید سخت‌گیرانه دامنه‌ها و الزام به HTTPS در مقصد (ضد SSRF)
$allowedHosts = [
    "edge.ippanel.com",
    "api2.ippanel.com",
    "rest.ippanel.com",
    "payment.zarinpal.com",
    "api.zarinpal.com",
    "www.zarinpal.com"
];

$parsedScheme = parse_url($targetUrl, PHP_URL_SCHEME);
$parsedHost = parse_url($targetUrl, PHP_URL_HOST);

if ($parsedScheme !== "https" || !in_array($parsedHost, $allowedHosts, true)) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Target URL Not Permitted"]);
    exit;
}

$forwardHeaders = ["Content-Type: application/json", "Accept: application/json"];
if (!empty($reqData["headers"]) && is_array($reqData["headers"])) {
    foreach ($reqData["headers"] as $k => $v) {
        $cleanKey = preg_replace("/[^a-zA-Z0-9\-_]/", "", $k);
        $cleanVal = str_replace(["\r", "\n"], "", strval($v));
        if ($cleanKey !== "") {
            $forwardHeaders[] = $cleanKey . ": " . $cleanVal;
        }
    }
}

$payloadJson = isset($reqData["payload"]) ? json_encode($reqData["payload"]) : "{}";

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadJson);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$responseBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($responseBody === false) {
    http_response_code(502);
    echo json_encode(["ok" => false, "error" => "Upstream Gateway Unreachable"]);
    exit;
}

http_response_code($httpCode ? $httpCode : 200);
echo $responseBody;
