import { getSessionToken } from '../security/sessionCookie.js';

export function createAuthenticationMiddleware(authService) {
  return async (request, _response, next) => {
    try {
      request.user = await authService.authenticate(getSessionToken(request));
      return next();
    } catch (error) { return next(error); }
  };
}

