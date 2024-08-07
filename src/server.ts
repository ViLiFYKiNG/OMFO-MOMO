import { Config } from './config';
import app from './app';
import logger from './config/logger';
import { AppDataSource } from './config/data-source';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully.');
    app.listen(Config.PORT, () => {
      logger.info(`Server is running on port ${Config.PORT}.`);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error starting server: ${error.message}`);
      setTimeout(() => process.exit(1), 1000);
    }
  }
};

startServer();
