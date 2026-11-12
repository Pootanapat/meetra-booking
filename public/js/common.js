const SESSION_STORAGE_KEY = 'meetra_session';

function escapeForHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
    if (!session?.user?.id || !session.user.email) return null;
    return session;
  } catch {
    return null;
  }
}

function getUser() {
  return getSession()?.user ?? null;
}

function setSession(user) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
  updateUserUI();
}

function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  updateUserUI();
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  if (response.status === 401) clearSession();
  return response;
}

function updateUserUI() {
  const user = getUser();
  const label = document.getElementById('userLabel');
  const avatar = document.getElementById('avatar');
  const login = document.getElementById('loginTop');
  const register = document.getElementById('registerTop');
  const logoutButton = document.getElementById('logoutTop');
  if (label) label.textContent = user?.name || 'ผู้เยี่ยมชม';
  if (avatar) avatar.textContent = user?.name?.charAt(0).toUpperCase() || 'G';
  if (login) login.style.display = user ? 'none' : '';
  if (register) register.style.display = user ? 'none' : '';
  if (logoutButton) logoutButton.style.display = user ? '' : 'none';
}

async function logout() {
  try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); }
  finally {
    clearSession();
    location.href = 'index.html';
  }
}

Object.assign(window, {
  getSession, getUser, setSession, clearSession, apiFetch, updateUserUI, logout, escapeForHtml,
});

document.addEventListener('DOMContentLoaded', updateUserUI);
window.addEventListener('pageshow', updateUserUI);
