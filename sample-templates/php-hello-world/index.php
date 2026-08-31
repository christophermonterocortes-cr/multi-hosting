<?php
$pageTitle = "PHP Dynamic Application - Multi Hosting";
$timestamp = date("Y-m-d H:i:s T");
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Nginx/PHP-FPM';
$phpVersion = PHP_VERSION;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #0f172a; color: #f8fafc; padding: 3rem 1.5rem; display: flex; justify-content: center; }
        .container { max-width: 700px; width: 100%; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; padding: 2.5rem; }
        h1 { color: #38bdf8; font-size: 2rem; margin-bottom: 1rem; }
        p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
        .metric-card { background: #0f172a; padding: 1.25rem; border-radius: 0.5rem; border: 1px solid #334155; }
        .metric-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .metric-val { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }
        .footer { border-top: 1px solid #334155; padding-top: 1rem; font-size: 0.85rem; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐘 PHP Hello World Application</h1>
        <p>This dynamic PHP script was processed on-the-fly by the Multi Hosting container runtime via PHP-FPM.</p>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">PHP Engine Version</div>
                <div class="metric-val"><?php echo $phpVersion; ?></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Execution Time</div>
                <div class="metric-val"><?php echo $timestamp; ?></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-val"><?php echo round(memory_get_usage() / 1024 / 1024, 2); ?> MB</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Server SAPI</div>
                <div class="metric-val"><?php echo php_sapi_name(); ?></div>
            </div>
        </div>

        <div class="footer">
            Multi Hosting Cloud • Isolated Container Runtime
        </div>
    </div>
</body>
</html>
