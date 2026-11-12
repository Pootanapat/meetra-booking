const USERS_KEY = 'kmitlUsers';
const PASSWORD_ITERATIONS = 600_000;

async function derivePasswordHash(password, salt) {
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS,
    }, key, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function makeCredential(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {
        salt: btoa(String.fromCharCode(...salt)),
        hash: await derivePasswordHash(password, salt),
    };
}

async function loadAccounts() {
    const raw = localStorage.getItem(USERS_KEY);
    const accounts = JSON.parse(raw ?? '[]');
    if (!Array.isArray(accounts)) throw new Error('Invalid account storage');
    if (!accounts.some(account => typeof account?.password === 'string')) return accounts;

    const migrated = await Promise.all(accounts.map(async account => {
        if (typeof account?.password !== 'string') return account;
        const { password, ...profile } = account;
        return { ...profile, credential: await makeCredential(password) };
    }));
    saveAccounts(migrated);
    return migrated;
}

function saveAccounts(accounts) {
    localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
}

function withAccountsLock(operation) {
    return navigator.locks ? navigator.locks.request(USERS_KEY, operation) : operation();
}

async function authenticate(form) {
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const accounts = await loadAccounts();
    const matching = accounts.filter(account => account?.email?.toLowerCase() === email.toLowerCase());

    if (form.dataset.authMode === 'register') {
        const name = form.querySelector('#name').value.trim();
        if (!name) return { error: 'กรุณากรอกชื่อ-นามสกุล' };
        if (password !== form.querySelector('#confirmPassword').value) return { error: 'รหัสผ่านไม่ตรงกัน' };
        if (matching.length) return { error: 'อีเมลนี้ถูกใช้แล้ว' };

        const user = { id: crypto.randomUUID(), name, email };
        saveAccounts([...accounts, { ...user, credential: await makeCredential(password) }]);
        return { user };
    }

    const user = matching.find(account => account.email === email) ?? (matching.length === 1 ? matching[0] : null);
    if (user?.credential) {
        const salt = Uint8Array.from(atob(user.credential.salt), character => character.charCodeAt(0));
        if (await derivePasswordHash(password, salt) === user.credential.hash) return { user };
    }
    return { error: 'ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง' };
}

const authForm = document.querySelector('form[data-auth-mode]');
authForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = authForm.querySelector('button[type="submit"]');
    if (submit.disabled) return;
    const errorBox = document.getElementById('authError');
    submit.disabled = true;
    errorBox.hidden = true;
    try {
        const { user, error } = await withAccountsLock(() => authenticate(authForm));
        if (error) {
            errorBox.textContent = error;
            errorBox.hidden = false;
            return;
        }
        setCurrentUser(user);
        location.href = 'index.html';
    } catch {
        errorBox.textContent = 'ดำเนินการไม่สำเร็จ กรุณาเปิดเว็บผ่าน localhost หรือ HTTPS แล้วลองใหม่';
        errorBox.hidden = false;
    } finally {
        submit.disabled = false;
    }
});

// Upgrade credentials already saved by previous versions, even before the next login.
if (localStorage.getItem(USERS_KEY) !== null) {
    withAccountsLock(loadAccounts).catch(error => console.error('Could not upgrade local accounts', error));
}
