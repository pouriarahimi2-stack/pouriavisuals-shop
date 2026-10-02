<?php
/**
 * AXON CORE - Secure Iran Static IP Relay for Netafraz Host
 * آپلود در مسیر: domains/axoncore.ir/public_html/gate/axon-relay.php
 */
header("Content-Type: application/json; charset=utf-8");

// کلید امنیتی اختصاصی بین سرور سایت و هاست نت‌افراز شما (غیرقابل استفاده توسط افراد غیرمجاز)
$EXPECTED_SECRET = "AXON_NETAFRAZ_BRIDGE_SECRET_2026_9F8E7D6C5B4A";

$providedSecret = isset($_SERVER["HTTP_X_AXON_RELAY_KEY"]) ? trim($_SERVER["HTTP_X_AXON_RELAY_KEY"]) : "";
if ($providedSecret !== $EXPECTED_SECRET) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Unauthorized Relay Access"]);
    exit;
}

$rawInput = file_get_contents("php://input");
$reqData = json_decode($rawInput, true);

if (!$reqData || empty($reqData["targetUrl"])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing targetUrl"]);
    exit;
}

$targetUrl = trim($reqData["targetUrl"]);

// لیست سفید امنیتی: فقط مجاز به ارتباط با سرورهای رسمی IPPanel و ZarinPal
$allowedHosts = [
    "edge.ippanel.com",
    "api2.ippanel.com",
    "rest.ippanel.com",
    "payment.zarinpal.com",
    "api.zarinpal.com",
    "www.zarinpal.com"
];

$parsedHost = parse_url($targetUrl, PHP_URL_HOST);
if (!in_array($parsedHost, $allowedHosts, true)) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Target host not allowed: " . $parsedHost]);
    exit;
}

$forwardHeaders = ["Content-Type: application/json", "Accept: application/json"];
if (!empty($reqData["headers"]) && is_array($reqData["headers"])) {
    foreach ($reqData["headers"] as $k => $v) {
        $forwardHeaders[] = $k . ": " . $v;
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

$responseBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($responseBody === false) {
    http_response_code(502);
    echo json_encode([
        "ok" => false,
        "error" => "Netafraz cURL Error: " . $curlErr,
        "serverIp" => isset($_SERVER["SERVER_ADDR"]) ? $_SERVER["SERVER_ADDR"] : ""
    ]);
    exit;
}

http_response_code($httpCode ? $httpCode : 200);
echo $responseBody;
