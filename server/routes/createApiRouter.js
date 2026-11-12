import { Router } from 'express';

export function createApiRouter({ authController, bookingController, roomController, requireAuthentication }) {
  const router = Router();
  router.post('/register', authController.register.bind(authController));
  router.post('/login', authController.login.bind(authController));
  router.get('/rooms', roomController.list.bind(roomController));
  router.get('/availability', roomController.availability.bind(roomController));
  router.get('/statistics', roomController.statistics.bind(roomController));
  router.get('/bookings', requireAuthentication, bookingController.list.bind(bookingController));
  router.post('/bookings', requireAuthentication, bookingController.create.bind(bookingController));
  router.put('/bookings/:id', requireAuthentication, bookingController.update.bind(bookingController));
  router.patch('/bookings/:id/cancel', requireAuthentication, bookingController.cancel.bind(bookingController));
  return router;
}

