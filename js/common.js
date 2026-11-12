const CURRENT_USER_KEY = 'kmitlCurrentUser';

function userProfile(user) {
    if (typeof user?.name !== 'string' || typeof user.email !== 'string') return null;
    const { id, name, email } = user;
    return id == null ? { name, email } : { id, name, email };
}

function getUser() {
    try {
        return userProfile(JSON.parse(localStorage.getItem(CURRENT_USER_KEY)));
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    const profile = userProfile(user);
    if (profile) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    else localStorage.removeItem(CURRENT_USER_KEY);
    updateUserUI();
}

const todayISO = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};
const fmtTime = time => time;

function updateUserUI() {
    const user = getUser();
    const label = document.getElementById('userLabel');
    const avatar = document.getElementById('avatar');
    const login = document.getElementById('loginTop');
    const register = document.getElementById('registerTop');
    const logoutButton = document.getElementById('logoutTop');
    if (label) label.textContent = user?.name || 'ผู้เยี่ยมชม';
    if (avatar) avatar.textContent = user?.name.charAt(0) || 'G';
    if (login) login.style.display = user ? 'none' : '';
    if (register) register.style.display = user ? 'none' : '';
    if (logoutButton) logoutButton.style.display = user ? '' : 'none';
}

function logout() {
    setCurrentUser(null);
    location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    const profile = getUser();
    if (raw !== null && raw !== JSON.stringify(profile)) setCurrentUser(profile);
    else updateUserUI();
});
window.addEventListener('pageshow', updateUserUI);
window.addEventListener('storage', event => {
    if (event.key === CURRENT_USER_KEY || event.key === null) updateUserUI();
});
