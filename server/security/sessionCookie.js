export const SESSION_COOKIE_NAME = 'meetra_session';

const parseCookies = header => Object.fromEntries(
  String(header ?? '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf('=');
      if (separator < 0) return [part, ''];
      const name = part.slice(0, separator);
      const value = part.slice(separator + 1);
      try { return [name, decodeURIComponent(value)]; }
      catch { return [name, '']; }
    }),
);

export function getSessionToken(request) {
  const authorization = request.get('authorization') ?? '';
  if (authorization.startsWith('Bearer ')) return authorization.slice(7);
  return parseCookies(request.get('cookie'))[SESSION_COOKIE_NAME] ?? '';
}

export function sessionCookieOptions({ secure = false, maxAge } = {}) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}
