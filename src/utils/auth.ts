export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

const CURRENT_USER_KEY = 'kmitl_current_user';

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function requireLoginForBooking(): CurrentUser | null {
  const user = getCurrentUser();
  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนทำการจองห้องประชุม');
    window.location.href = 'login.html';
    return null;
  }
  return user;
}