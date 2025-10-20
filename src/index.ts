import App from './app';
import Logger from './utils/logger';

async function main(): Promise<void> {
  try {
    const app = new App();
    
    // Initialize the application
    await app.initialize();
    
    // Start the server
    app.listen();
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      Logger.info('SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

  } catch (error) {
    Logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  Logger.error('Unhandled error in main', error);
  process.exit(1);
});
