export class BookingController {
  constructor(bookingService) { this.bookingService = bookingService; }

  async list(request, response, next) {
    try { return response.json(await this.bookingService.listForUser(request.user.id)); }
    catch (error) { return next(error); }
  }

  async create(request, response, next) {
    try {
      const booking = await this.bookingService.create(request.user.id, request.body);
      return response.status(201).json({ success: true, ...booking });
    } catch (error) { return next(error); }
  }

  async update(request, response, next) {
    try {
      await this.bookingService.update(request.user.id, request.params.id, request.body);
      return response.json({ success: true });
    } catch (error) { return next(error); }
  }

  async cancel(request, response, next) {
    try {
      await this.bookingService.cancel(request.user.id, request.params.id);
      return response.json({ success: true });
    } catch (error) { return next(error); }
  }
}

