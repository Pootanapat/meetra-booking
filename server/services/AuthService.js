import crypto from 'node:crypto';
import { SESSION_LIFETIME_MS } from '../config.js';
import { ApplicationError } from '../errors/ApplicationError.js';

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const hashPassword = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) reject(error);
    else resolve(key.toString('hex'));
  });
});

export class AuthService {
  constructor(userRepository, sessionRepository) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
  }

  async register(input) {
    const name = String(input.name ?? '').trim();
    const email = String(input.email ?? '').trim().toLowerCase();
    const password = String(input.password ?? '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      throw new ApplicationError(400, 'กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร');
    }
    if (await this.userRepository.findByEmail(email)) {
      throw new ApplicationError(409, 'อีเมลนี้ถูกใช้งานแล้ว');
    }
    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(password, passwordSalt);
    await this.userRepository.create({
      id: crypto.randomUUID(), name, email, passwordHash, passwordSalt,
    });
  }

  async login(input) {
    const email = String(input.email ?? '').trim().toLowerCase();
    const password = String(input.password ?? '');
    const account = await this.userRepository.findByEmail(email);
    if (!account || await hashPassword(password, account.password_salt) !== account.password_hash) {
      throw new ApplicationError(401, 'ไม่พบบัญชีหรือรหัสผ่านไม่ถูกต้อง');
    }
    const token = crypto.randomBytes(32).toString('base64url');
    await this.sessionRepository.create({
      tokenHash: hashToken(token),
      userId: account.id,
      expiresAt: Date.now() + SESSION_LIFETIME_MS,
    });
    return {
      token,
      user: { id: account.id, name: account.name, email: account.email, role: account.role },
    };
  }

  async authenticate(token) {
    if (!token) throw new ApplicationError(401, 'กรุณาเข้าสู่ระบบ');
    const user = await this.sessionRepository.findActiveUser(hashToken(token), Date.now());
    if (!user) throw new ApplicationError(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    return user;
  }
}

