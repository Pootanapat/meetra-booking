const SESSION_STORAGE_KEY = 'meetra_session';

function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    if (!session?.token || !session?.user?.id || !session.user.email) return null;
    return session;
  } catch {
    return null;
  }
}

function getUser() {
  return getSession()?.user ?? null;
}

function setSession(user, token) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, token }));
  updateUserUI();
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  updateUserUI();
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getSession()?.token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
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

function logout() {
  clearSession();
  location.href = 'index.html';
}

Object.assign(window, { getSession, getUser, setSession, clearSession, apiFetch, updateUserUI, logout });

document.addEventListener('DOMContentLoaded', updateUserUI);
window.addEventListener('pageshow', updateUserUI);
