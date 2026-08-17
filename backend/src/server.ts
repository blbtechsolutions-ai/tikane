import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './common/utils/logger';

const app = createApp();

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`
╔══════════════════════════════════════════════════╗
║          🇭🇹  TIKANE API  -  v1.0.0  🇭🇹           ║
╠══════════════════════════════════════════════════╣
║  Environment : ${config.env.padEnd(32)}║
║  Port        : ${String(config.port).padEnd(32)}║
║  API Prefix  : ${config.apiPrefix.padEnd(32)}║
║  Docs        : http://localhost:${config.port}/api/docs  ║
╚══════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received - shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
