import app from './app';
import { config } from './config/env';
import { initDatabase } from './config/database';
import { AuthService } from './services/auth.service';
import { PortService } from './services/port.service';

async function startServer() {
  try {
    console.log('🚀 Initializing Multi Hosting Platform...');
    
    // 1. Initialize SQLite / Control Plane Database
    initDatabase();

    // 2. Seed Default Administrator Account
    await AuthService.seedDefaultAdmin();

    // 3. Auto-discover and reconcile all Docker project containers & databases
    const { DockerService } = await import('./services/docker.service');
    const restoredCount = await DockerService.reconcileExistingContainers();
    if (restoredCount > 0) {
      console.log(`📦 Reconciled & restored ${restoredCount} project containers.`);
    }

    // 4. Reconcile Port Allocations on startup
    await PortService.reconcilePorts();

    // 4. Start HTTP Server
    const server = app.listen(config.port, config.host, () => {
      console.log(`=======================================================`);
      console.log(`🌐 Multi Hosting Platform is active and listening`);
      console.log(`📡 URL: http://${config.host}:${config.port}`);
      console.log(`📖 API Documentation: http://${config.host}:${config.port}/api/docs`);
      console.log(`🔑 Default Admin: ${config.defaultAdminUsername} / ${config.defaultAdminPassword}`);
      console.log(`🔌 Port Range: ${config.portRangeStart} - ${config.portRangeEnd}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down Multi Hosting server...');
      server.close(() => {
        console.log('👋 Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err: any) {
    console.error('❌ Failed to start Multi Hosting server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
