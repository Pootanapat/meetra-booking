export function createAuthenticationMiddleware(authService) {
  return async (request, _response, next) => {
    try {
      const authorization = request.get('authorization') ?? '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      request.user = await authService.authenticate(token);
      return next();
    } catch (error) { return next(error); }
  };
}

