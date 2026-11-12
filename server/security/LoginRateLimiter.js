import { ApplicationError } from '../errors/ApplicationError.js';

export class LoginRateLimiter {
  constructor({ maxAttempts = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.now = now;
    this.attempts = new Map();
  }

  keyFor(request) {
    const email = String(request.body?.email ?? '').trim().toLowerCase();
    return `${request.ip}|${email}`;
  }

  check(request) {
    const key = this.keyFor(request);
    const record = this.attempts.get(key);
    if (!record || record.resetAt <= this.now()) {
      this.attempts.delete(key);
      return;
    }
    if (record.count >= this.maxAttempts) {
      throw new ApplicationError(429, 'เข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่ภายหลัง');
    }
  }

  recordFailure(request) {
    const key = this.keyFor(request);
    const currentTime = this.now();
    const record = this.attempts.get(key);
    if (!record || record.resetAt <= currentTime) {
      this.attempts.set(key, { count: 1, resetAt: currentTime + this.windowMs });
      return;
    }
    record.count += 1;
  }

  reset(request) {
    this.attempts.delete(this.keyFor(request));
  }
}
