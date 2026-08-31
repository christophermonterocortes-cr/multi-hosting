<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Application Running - Multi Hosting</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .card { background: rgba(30, 41, 59, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; padding: 2.5rem; max-width: 580px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
        .badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.25rem; }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #c084fc; }
        h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.75rem; color: #ffffff; }
        p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
        .info-box { background: #0f172a; border-radius: 0.5rem; padding: 1.25rem; text-align: left; font-size: 0.875rem; color: #cbd5e1; border: 1px solid #334155; margin-bottom: 1.5rem; }
        .info-row { display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid #1e293b; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; }
        .pill { background: #334155; color: #38bdf8; padding: 0.1rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; }
        .footer { font-size: 0.75rem; color: #64748b; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">
            <span class="badge-dot"></span>
            PHP Runtime Active
        </div>
        <h1>PHP Environment Online</h1>
        <p>Your PHP website container is running and ready. Upload your PHP files, scripts, or framework applications via the Multi Hosting dashboard.</p>
        <div class="info-box">
            <div class="info-row"><span class="info-label">PHP Version:</span> <span><?php echo PHP_VERSION; ?></span></div>
            <div class="info-row"><span class="info-label">Server SAPI:</span> <span><?php echo php_sapi_name(); ?></span></div>
            <div class="info-row"><span class="info-label">Database Drivers:</span> <span><?php 
                $drivers = [];
                if (extension_loaded('pdo_pgsql')) $drivers[] = 'PDO PostgreSQL';
                if (extension_loaded('pdo_mysql')) $drivers[] = 'PDO MySQL';
                if (extension_loaded('mysqli')) $drivers[] = 'MySQLi';
                echo implode(', ', $drivers);
            ?></span></div>
            <div class="info-row"><span class="info-label">Document Root:</span> <code><?php echo htmlspecialchars($_SERVER['DOCUMENT_ROOT'] ?? '/var/www/html'); ?></code></div>
            <div class="info-row"><span class="info-label">Server Time:</span> <span><?php echo date('Y-m-d H:i:s T'); ?></span></div>
        </div>
        <div class="footer">
            Multi Hosting Cloud Platform • PHP Isolated Workload
        </div>
    </div>
</body>
</html>
