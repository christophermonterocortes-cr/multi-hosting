<?php
$dbType = getenv('DB_TYPE') ?: 'pgsql'; // 'pgsql' or 'mysql'
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: ($dbType === 'pgsql' ? '5432' : '3306');
$dbName = getenv('DB_NAME') ?: 'project_demo_db';
$dbUser = getenv('DB_USER') ?: 'project_demo_user';
$dbPass = getenv('DB_PASSWORD') ?: '';

$connectionStatus = 'not_connected';
$errorMessage = null;
$items = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_connection'])) {
    $dbType = $_POST['db_type'] ?? $dbType;
    $dbHost = $_POST['db_host'] ?? $dbHost;
    $dbPort = $_POST['db_port'] ?? $dbPort;
    $dbName = $_POST['db_name'] ?? $dbName;
    $dbUser = $_POST['db_user'] ?? $dbUser;
    $dbPass = $_POST['db_password'] ?? $dbPass;

    try {
        if ($dbType === 'pgsql') {
            $dsn = "pgsql:host={$dbHost};port={$dbPort};dbname={$dbName}";
        } else {
            $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        }
        
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        
        $connectionStatus = 'success';

        // Auto-create a demo table and insert/read records to prove write & read privileges
        if ($dbType === 'pgsql') {
            $pdo->exec("CREATE TABLE IF NOT EXISTS demo_notes (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
        } else {
            $pdo->exec("CREATE TABLE IF NOT EXISTS demo_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
        }

        if (isset($_POST['note_title']) && trim($_POST['note_title']) !== '') {
            $stmt = $pdo->prepare("INSERT INTO demo_notes (title) VALUES (?)");
            $stmt->execute([trim($_POST['note_title'])]);
        }

        $stmt = $pdo->query("SELECT * FROM demo_notes ORDER BY id DESC LIMIT 10");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (Exception $e) {
        $connectionStatus = 'error';
        $errorMessage = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Database Live Demo - Multi Hosting</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #0b1120; color: #f8fafc; padding: 2.5rem 1.5rem; display: flex; justify-content: center; }
        .wrapper { max-width: 800px; width: 100%; }
        .header { margin-bottom: 2rem; }
        h1 { color: #38bdf8; font-size: 2rem; margin-bottom: 0.5rem; }
        p { color: #94a3b8; }
        .card { background: #1e293b; border-radius: 0.75rem; border: 1px solid #334155; padding: 2rem; margin-bottom: 1.5rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: 0.85rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.35rem; }
        input, select { width: 100%; background: #0f172a; border: 1px solid #334155; padding: 0.65rem 0.85rem; border-radius: 0.5rem; color: #f8fafc; font-size: 0.95rem; }
        input:focus, select:focus { outline: none; border-color: #38bdf8; }
        .btn { background: #0284c7; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; width: 100%; font-size: 1rem; }
        .btn:hover { background: #0369a1; }
        .alert { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.95rem; }
        .alert-success { background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #4ade80; }
        .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; }
        .table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .table th, .table td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; }
        .table th { color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🗄️ PHP Database Connection Verification</h1>
            <p>Connect and interact with your Multi Hosting provisioned PostgreSQL / MariaDB instance.</p>
        </div>

        <?php if ($connectionStatus === 'success'): ?>
            <div class="alert alert-success">
                ✅ <strong>Database Connected Successfully!</strong> Scoped privileges verified and queries executed.
            </div>
        <?php elseif ($connectionStatus === 'error'): ?>
            <div class="alert alert-error">
                ❌ <strong>Connection Error:</strong> <?php echo htmlspecialchars($errorMessage); ?>
            </div>
        <?php endif; ?>

        <div class="card">
            <h3 style="margin-bottom: 1.25rem;">Database Credentials</h3>
            <form method="POST">
                <input type="hidden" name="test_connection" value="1">
                <div class="grid">
                    <div class="form-group">
                        <label>Database Engine</label>
                        <select name="db_type">
                            <option value="pgsql" <?php echo $dbType === 'pgsql' ? 'selected' : ''; ?>>PostgreSQL</option>
                            <option value="mysql" <?php echo $dbType === 'mysql' ? 'selected' : ''; ?>>MySQL / MariaDB</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Host / IP</label>
                        <input type="text" name="db_host" value="<?php echo htmlspecialchars($dbHost); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Port</label>
                        <input type="text" name="db_port" value="<?php echo htmlspecialchars($dbPort); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Database Name</label>
                        <input type="text" name="db_name" value="<?php echo htmlspecialchars($dbName); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="db_user" value="<?php echo htmlspecialchars($dbUser); ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="db_password" value="<?php echo htmlspecialchars($dbPass); ?>" placeholder="Generated password">
                    </div>
                </div>

                <div class="form-group" style="margin-top: 0.5rem;">
                    <label>Add a Test Note (Write Operation Verification)</label>
                    <input type="text" name="note_title" placeholder="e.g., Testing Multi Hosting Database Isolation">
                </div>

                <button type="submit" class="btn">Test Connection & Query Database</button>
            </form>
        </div>

        <?php if (!empty($items)): ?>
            <div class="card">
                <h3>Queried Records (demo_notes table)</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Note Title</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                            <tr>
                                <td>#<?php echo $item['id']; ?></td>
                                <td><?php echo htmlspecialchars($item['title']); ?></td>
                                <td><?php echo $item['created_at']; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
