import { Platform } from 'react-native';

// ============================================================
// API Base URL
// ============================================================
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api';

// ============================================================
// Token Storage (SecureStore for native, localStorage for web)
// ============================================================
let SecureStore: any = null;

async function loadSecureStore() {
  if (Platform.OS !== 'web') {
    try {
      SecureStore = require('expo-secure-store');
    } catch {
      // fallback
    }
  }
}
loadSecureStore();

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
  }
  if (SecureStore) {
    return await SecureStore.getItemAsync('jwt_token');
  }
  return null;
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem('jwt_token', token);
    return;
  }
  if (SecureStore) {
    await SecureStore.setItemAsync('jwt_token', token);
  }
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem('jwt_token');
    return;
  }
  if (SecureStore) {
    await SecureStore.deleteItemAsync('jwt_token');
  }
}

// ============================================================
// Core fetch helper (ไม่ export ตรง — ใช้ผ่าน api object เท่านั้น)
// ============================================================
async function fetchWithAuth(
  method: string,
  path: string,
  body?: any,
  options?: { headers?: Record<string, string>; isFormData?: boolean }
): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!options?.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = options?.isFormData ? body : JSON.stringify(body);
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, config);

  if (response.status === 401) {
    await removeToken();
  }

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || 'เกิดข้อผิดพลาด');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ============================================================
// api object — ใช้สำหรับเรียก API ทุกที่ในโปรเจค
// วิธีใช้: import { api } from '@/lib/api';
//          await api.get('/repairs');
//          await api.post('/repairs', { ... });
// ============================================================
export const api = {
  get: (path: string) => fetchWithAuth('GET', path),
  post: (path: string, body?: any, options?: { isFormData?: boolean }) =>
    fetchWithAuth('POST', path, body, options),
  put: (path: string, body?: any) => fetchWithAuth('PUT', path, body),
  patch: (path: string, body?: any) => fetchWithAuth('PATCH', path, body),
  delete: (path: string) => fetchWithAuth('DELETE', path),
};



// ============================================================
// Helper functions — Wrapper ที่ตั้งชื่อให้อ่านง่าย
// ทุกตัวเรียก api.get/post/put/patch/delete จริงๆ
// ============================================================

// --- Repair Jobs ---
// GET  /api/repairs          → รายการทั้งหมด
// GET  /api/repairs/:id      → รายละเอียด 1 งาน
// POST /api/repairs          → สร้างงานใหม่
// PUT  /api/repairs/:id/status  → เปลี่ยนสถานะ
// PUT  /api/repairs/:id/signature → อัปเดตลายเซ็น
// DELETE /api/repairs/:id    → ลบงาน

export function getRepairs() {
  return api.get('/repairs');
}

export function getRepair(jobId: string | number) {
  return api.get(`/repairs/${jobId}`);
}

export function createRepairJob(data: any) {
  return api.post('/repairs', data);
}

export function updateRepair(jobId: string | number, data: any) {
  return api.put(`/repairs/${jobId}`, data);
}

export function updateRepairStatus(jobId: string | number, data: any) {
  return api.patch(`/repairs/${jobId}/status`, data);
}

export function updateRepairSignature(jobId: string | number, data: any) {
  return api.patch(`/repairs/${jobId}/signature`, data);
}

export function deleteRepair(jobId: string | number) {
  return api.delete(`/repairs/${jobId}`);
}

// --- Repair Job Detail Log ---
// POST /api/repairs/:id/detail → บันทึก action log
export async function logRepairJobDetail(
  jobId: number,
  actionTypeId: number,
  userId?: string | null,
  remark?: string | null
) {
  try {
    const payload: any = { action_type_id: actionTypeId };
    if (userId) payload.user_id = userId;
    if (remark) payload.remark = remark;
    const res = await api.post(`/repairs/${jobId}/detail`, payload);
    return { data: res.data, error: null };
  } catch (err: any) {
    console.error("Error logging repair_job_detail:", err);
    return { data: null, error: err };
  }
}

// --- Devices ---
// GET  /api/devices           → รายการอุปกรณ์
// POST /api/devices           → สร้างอุปกรณ์ใหม่
// PUT  /api/devices/:id       → แก้ไขอุปกรณ์

export function getDevices(customerId?: string) {
  const url = customerId ? `/devices?customer_id=${customerId}` : '/devices';
  return api.get(url);
}

export function createDevice(data: any) {
  return api.post('/devices', data);
}

export function updateDevice(id: number | string, data: any) {
  return api.put(`/devices/${id}`, data);
}

// --- Quotations ---
// GET    /api/quotations              → รายการใบเสนอราคาทั้งหมด
// GET    /api/quotations/:id          → ดูใบเสนอราคา
// POST   /api/quotations              → สร้างใบเสนอราคา
// PUT    /api/quotations/:id          → แก้ไขใบเสนอราคา
// DELETE /api/quotations/:id          → ลบใบเสนอราคา
// PATCH  /api/quotations/:id/status   → เปลี่ยนสถานะใบเสนอราคา

export function getQuotations(params?: { status_id?: number | string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status_id) query.append('status_id', String(params.status_id));
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString();
  return api.get(`/quotations${qStr ? `?${qStr}` : ''}`);
}

export function getQuotation(quotationId: string | number) {
  return api.get(`/quotations/${quotationId}`);
}

export function createQuotation(data: any) {
  return api.post('/quotations', data);
}

export function updateQuotation(quotationId: string | number, data: any) {
  return api.put(`/quotations/${quotationId}`, data);
}

export function deleteQuotation(quotationId: string | number) {
  return api.delete(`/quotations/${quotationId}`);
}

export function updateQuotationStatus(quotationId: string | number, data: any) {
  return api.patch(`/quotations/${quotationId}/status`, data);
}

// --- Payments ---
// POST /api/payments → บันทึกการชำระเงิน

export function createPayment(data: any, isFormData = false) {
  return api.post('/payments', data, { isFormData });
}

// PATCH /api/payments/:jobId/verify → พนักงานยืนยันการชำระเงิน
export function verifyPayment(jobId: number | string) {
  return api.patch(`/payments/${jobId}/verify`, {});
}

// PATCH /api/payments/:jobId/reject → พนักงานปฏิเสธการชำระเงิน (ให้ลูกค้าส่งใหม่)
export function rejectPayment(jobId: number | string, reason?: string) {
  return api.patch(`/payments/${jobId}/reject`, { reason });
}

// --- Items (อะไหล่/บริการ) ---
// GET    /api/items            → รายการทั้งหมด
// POST   /api/items            → เพิ่มรายการ
// PUT    /api/items/:id        → แก้ไขรายการ
// DELETE /api/items/:id        → ลบรายการ

export function getItems(typeId?: number | string) {
  if (!typeId) return api.get('/items');
  const numId = Number(typeId);
  const typeStr = numId === 1 ? 'parts' : 'services';
  return api.get(`/items?item_type_id=${numId}&type=${typeStr}`);
}

export function createItem(data: any) {
  return api.post('/items', data);
}

export function updateItem(id: number, data: any) {
  return api.put(`/items/${id}`, data);
}

export function deleteItem(id: number) {
  return api.delete(`/items/${id}`);
}

// --- Staff ---
// GET /api/staff          → รายชื่อพนักงาน (Manager only)
// PUT /api/staff/:id      → อัปเดตข้อมูลพนักงาน

export function getStaff() {
  return api.get('/staff');
}

export function updateStaff(id: number | string, data: any) {
  return api.put(`/staff/${id}`, data);
}

// --- Dashboard ---
// GET /api/dashboard/metrics?role=...&device_type=...&date_start=...&date_end=...
// GET /api/dashboard/trend?period=...&metric_type=...&date_start=...&date_end=...
// GET /api/dashboard/category?date_start=...&date_end=...

export interface DashboardMetricsParams {
  role?: string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardMetrics(params?: DashboardMetricsParams | string) {
  if (typeof params === 'string') {
    return api.get(`/dashboard/metrics?role=${encodeURIComponent(params)}`);
  }
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/metrics${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardTrendParams {
  period?: 'day' | 'month' | 'year' | string;
  metric_type?: 'count' | 'revenue';
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardTrend(params?: DashboardTrendParams | string) {
  if (typeof params === 'string') {
    return api.get(`/dashboard/trend?period=${encodeURIComponent(params)}`);
  }
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.metric_type) query.append('metric_type', params.metric_type);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/trend${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardCategoryParams {
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardCategory(params?: DashboardCategoryParams) {
  const query = new URLSearchParams();
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/category${qStr ? `?${qStr}` : ''}`);
}

// --- Slips ---
// GET  /api/slips     → รายการสลิปของ user
// POST /api/slips     → อัปโหลดสลิป (multipart)
// DELETE /api/slips/:id → ลบสลิป

export function getSlips() {
  return api.get('/slips');
}

export function createSlip(data: any) {
  return api.post('/slips', data, { isFormData: true });
}

export function deleteSlip(id: number | string) {
  return api.delete(`/slips/${id}`);
}

// --- Lookup ---
// GET /api/lookup/profiles?q=...&type=...
export function lookupProfiles(query: string, type: string) {
  return api.get(`/lookup/profiles?q=${encodeURIComponent(query)}&type=${type}`);
}

export function getLookupDeviceTypes() {
  return api.get('/lookup/device-types');
}

export function getLookupBrands() {
  return api.get('/lookup/brands');
}

export function getLookupModels(brandId?: number | string, deviceTypeId?: number | string) {
  let url = '/lookup/models';
  const params: string[] = [];
  if (brandId) params.push(`brand_id=${brandId}`);
  if (deviceTypeId) params.push(`device_type_id=${deviceTypeId}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  return api.get(url);
}

export function getLookupStatuses() {
  return api.get('/lookup/statuses');
}

export function getLookupPaymentMethods() {
  return api.get('/lookup/payment-methods');
}

export function getLookupActionTypes() {
  return api.get('/lookup/action-types');
}

export function getLookupItemTypes() {
  return api.get('/lookup/item-types');
}

export function getLookupQuotationStatuses() {
  return api.get('/lookup/quotation-statuses');
}
