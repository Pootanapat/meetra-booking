import { SESSION_LIFETIME_MS } from '../config.js';
import { getSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from '../security/sessionCookie.js';

export class AuthController {
  constructor(authService, loginRateLimiter, { secureCookies = false } = {}) {
    this.authService = authService;
    this.loginRateLimiter = loginRateLimiter;
    this.secureCookies = secureCookies;
  }

  async register(request, response, next) {
    try {
      await this.authService.register(request.body);
      return response.status(201).json({ success: true });
    } catch (error) { return next(error); }
  }

  async login(request, response, next) {
    try {
      this.loginRateLimiter.check(request);
      const session = await this.authService.login(request.body);
      this.loginRateLimiter.reset(request);
      response.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions({
        secure: this.secureCookies,
        maxAge: SESSION_LIFETIME_MS,
      }));
      return response.json({ success: true, user: session.user });
    } catch (error) {
      if (error.statusCode === 401) this.loginRateLimiter.recordFailure(request);
      return next(error);
    }
  }

  async logout(request, response, next) {
    try {
      const token = getSessionToken(request);
      if (token) await this.authService.logout(token);
      response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions({ secure: this.secureCookies }));
      return response.status(204).end();
    } catch (error) { return next(error); }
  }
}

