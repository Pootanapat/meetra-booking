export class AuthController {
  constructor(authService) { this.authService = authService; }

  async register(request, response, next) {
    try {
      await this.authService.register(request.body);
      return response.status(201).json({ success: true });
    } catch (error) { return next(error); }
  }

  async login(request, response, next) {
    try {
      const session = await this.authService.login(request.body);
      return response.json({ success: true, ...session });
    } catch (error) { return next(error); }
  }
}

