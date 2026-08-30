const app = require('./app');
const prisma = require('./config/db');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API docs are available at http://localhost:${PORT}/api/docs`);
});

// Handle graceful shutdowns
const shutdown = async () => {
  logger.info('Received shutdown signal. Stopping server gracefully...');
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed safely.');
      process.exit(0);
    } catch (error) {
      logger.error(`Error disconnecting database: ${error.message}`);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... Reason: ${err.message}`);
  if (err.stack) logger.error(err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... Error: ${err.message}`);
  if (err.stack) logger.error(err.stack);
  process.exit(1);
});
