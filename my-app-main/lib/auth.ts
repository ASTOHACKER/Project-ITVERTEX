import { api, getToken, saveToken, removeToken } from './api';

// ============================================================
// Auth Helpers
// ============================================================

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role_id: number;
  role_name: string;
  created_at?: string;
}

/**
 * เข้าสู่ระบบ
 */
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/login', { email, password });
  if (res.data?.token) {
    await saveToken(res.data.token);
  }
  return res.data;
}

/**
 * สมัครสมาชิก
 */
export async function register(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/register', data);
  if (res.data?.token) {
    await saveToken(res.data.token);
  }
  return res.data;
}

/**
 * ออกจากระบบ
 */
export async function logout(): Promise<void> {
  await removeToken();
}

/**
 * ดึงข้อมูล user ปัจจุบัน
 * return null ถ้าไม่ได้ login
 */
export async function getUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch {
    return null;
  }
}

/**
 * ตรวจสอบว่า login อยู่หรือไม่
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/**
 * ลืมรหัสผ่าน — ยืนยันด้วย email + เบอร์โทร
 */
export async function forgotPassword(email: string, phone: string): Promise<{ reset_token: string }> {
  const res = await api.post('/auth/forgot-password', { email, phone });
  return res.data;
}

/**
 * รีเซ็ตรหัสผ่านด้วย token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, new_password: newPassword });
}

/**
 * Helper: ดึง role name จาก user
 */
export function getRoleName(user: User): string {
  const role = (user.role_name || '').toLowerCase();
  if (role === 'manager') return 'manager';
  if (role === 'staff') return 'staff';
  if (role === 'tech' || role === 'technician') return 'tech';
  return 'customer';
}

/**
 * Helper: ดู role redirect path
 */
export function getRoleRedirectPath(user: User): string {
  const role = getRoleName(user);
  switch (role) {
    case 'manager': return '/(meneger)';
    case 'staff': return '/(staff)';
    case 'tech': return '/(technicain)';
    case 'customer': return '/(customer)';
    default: return '/(customer)';
  }
}

/** Alias สำหรับ getUser — ใช้ใน import ชื่อ getCurrentUser */
export const getCurrentUser = getUser;

// Re-export token functions
export { getToken, saveToken, removeToken };
