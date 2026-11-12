import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { DatabaseManager } from './server/database/DatabaseManager.js';
import { UserRepository } from './server/repositories/UserRepository.js';
import { SessionRepository } from './server/repositories/SessionRepository.js';
import { RoomRepository } from './server/repositories/RoomRepository.js';
import { BookingRepository } from './server/repositories/BookingRepository.js';
import { AuthService } from './server/services/AuthService.js';
import { BookingService } from './server/services/BookingService.js';
import { RoomService } from './server/services/RoomService.js';
import { AuthController } from './server/controllers/AuthController.js';
import { BookingController } from './server/controllers/BookingController.js';
import { RoomController } from './server/controllers/RoomController.js';
import { createAuthenticationMiddleware } from './server/middleware/createAuthenticationMiddleware.js';
import { createApiRouter } from './server/routes/createApiRouter.js';
import { ApplicationError } from './server/errors/ApplicationError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATABASE_FILE = path.join(__dirname, 'data', 'kmitl_booking.db');
const DEFAULT_STATIC_DIRECTORY = path.join(__dirname, 'dist');

export async function createApplication({
  databaseFilename = process.env.DATABASE_FILE || DEFAULT_DATABASE_FILE,
  staticDirectory = DEFAULT_STATIC_DIRECTORY,
} = {}) {
  const databaseManager = new DatabaseManager(databaseFilename);
  const database = await databaseManager.connect();

  const userRepository = new UserRepository(database);
  const sessionRepository = new SessionRepository(database);
  const roomRepository = new RoomRepository(database);
  const bookingRepository = new BookingRepository(database);
  const authService = new AuthService(userRepository, sessionRepository);
  const bookingService = new BookingService(bookingRepository, roomRepository);
  const roomService = new RoomService(roomRepository, bookingRepository);
  const authController = new AuthController(authService);
  const bookingController = new BookingController(bookingService);
  const roomController = new RoomController(roomService);
  const requireAuthentication = createAuthenticationMiddleware(authService);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', createApiRouter({
    authController,
    bookingController,
    roomController,
    requireAuthentication,
  }));

  if (staticDirectory) {
    app.use(express.static(staticDirectory, { dotfiles: 'deny', index: 'index.html' }));
  }

  app.use((error, _request, response, _next) => {
    if (error instanceof ApplicationError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    return response.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
  });

  return { app, database, close: () => databaseManager.close() };
}

export async function startServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 3000);
  const application = await createApplication(options);
  const server = application.app.listen(port, () => {
    console.log(`Meetra Booking running at http://localhost:${port}`);
  });
  return { ...application, server };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
