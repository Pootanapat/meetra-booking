import { Router } from 'express';

export function createApiRouter({ authController, bookingController, roomController, systemController, requireAuthentication }) {
  const router = Router();
  router.get('/health', systemController.health.bind(systemController));
  router.post('/register', authController.register.bind(authController));
  router.post('/login', authController.login.bind(authController));
  router.post('/logout', authController.logout.bind(authController));
  router.get('/rooms', roomController.list.bind(roomController));
  router.get('/availability', roomController.availability.bind(roomController));
  router.get('/statistics', requireAuthentication, roomController.statistics.bind(roomController));
  router.get('/bookings', requireAuthentication, bookingController.list.bind(bookingController));
  router.post('/bookings', requireAuthentication, bookingController.create.bind(bookingController));
  router.put('/bookings/:id', requireAuthentication, bookingController.update.bind(bookingController));
  router.patch('/bookings/:id/cancel', requireAuthentication, bookingController.cancel.bind(bookingController));
  return router;
}

