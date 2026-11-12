export class RoomController {
  constructor(roomService) { this.roomService = roomService; }

  async list(_request, response, next) {
    try { return response.json(await this.roomService.listRooms()); }
    catch (error) { return next(error); }
  }

  async availability(_request, response, next) {
    try { return response.json(await this.roomService.listAvailability()); }
    catch (error) { return next(error); }
  }

  async statistics(_request, response, next) {
    try { return response.json(await this.roomService.getStatistics()); }
    catch (error) { return next(error); }
  }
}

