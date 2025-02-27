import { app } from './app';
import { config } from './config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    const server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });

    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`${signal} received, shutting down gracefully`);
        server.close(async () => {
          console.log('HTTP server closed');
          await prisma.$disconnect();
          console.log('Database connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();