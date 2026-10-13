import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { ApiResponse, RepairJob } from '@/types/repair';
import type { QuotationItem } from '@/types/quotation';
import type { InventoryItem } from '@/types/item';

// ============================================================
// API Base URL & Server Origin
// ============================================================
const devHostIp = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS !== 'web' && devHostIp
    ? `http://${devHostIp}:3002/api`
    : 'http://localhost:3002/api');

export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// ============================================================
// Token Storage (SecureStore for native, localStorage for web)
// ============================================================
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    // fallback
  }
}

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

/**
 * แปลง path รูปภาพ (สลิป, ลายเซ็น) ให้เป็น Full URL ที่พร้อมแสดงผล
 * รองรับทั้ง base64 data:, http://, https:// และ local static assets
 */
export function getImageUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const base = API_ORIGIN;
  const clean = filePath.startsWith('/') ? filePath : `/${filePath}`;
  if (
    !clean.startsWith('/pubilc') &&
    !clean.startsWith('/public') &&
    !clean.startsWith('/slips') &&
    !clean.startsWith('/signatures')
  ) {
    return `${base}/public${clean}`;
  }
  return `${base}${clean}`;
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

  let data: any = null;
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || `HTTP error ${response.status}` };
  }

  if (!response.ok) {
    const error: any = new Error(data?.message || `เกิดข้อผิดพลาด (${response.status})`);
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

export function getRepairs(): Promise<ApiResponse<RepairJob[]>> {
  return api.get('/repairs');
}

export function getRepair(jobId: string | number): Promise<ApiResponse<RepairJob>> {
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

// --- Quotations ---
// GET    /api/quotations              → รายการใบเสนอราคาทั้งหมด
// GET    /api/quotations/:id          → ดูใบเสนอราคา
// POST   /api/quotations              → สร้างใบเสนอราคา
// PUT    /api/quotations/:id          → แก้ไขใบเสนอราคา
// DELETE /api/quotations/:id          → ลบใบเสนอราคา
// PATCH  /api/quotations/:id/status   → เปลี่ยนสถานะใบเสนอราคา

export function getQuotations(params?: { status_id?: number | string; search?: string }): Promise<ApiResponse<QuotationItem[]>> {
  const query = new URLSearchParams();
  if (params?.status_id) query.append('status_id', String(params.status_id));
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString();
  return api.get(`/quotations${qStr ? `?${qStr}` : ''}`);
}

export function getQuotation(quotationId: string | number): Promise<ApiResponse<QuotationItem>> {
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

export function getItems(typeId?: number | string): Promise<ApiResponse<InventoryItem[]>> {
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
// DELETE /api/staff/:id   → ลบข้อมูลพนักงาน

export function getStaff() {
  return api.get('/staff');
}

export function updateStaff(id: number | string, data: any) {
  return api.put(`/staff/${id}`, data);
}

export function deleteStaff(id: number | string) {
  return api.delete(`/staff/${id}`);
}

// --- Dashboard ---
// GET /api/dashboard/metrics?role=...&device_type=...&date_start=...&date_end=...
// GET /api/dashboard/trend?period=...&metric_type=...&date_start=...&date_end=...
// GET /api/dashboard/category?date_start=...&date_end=...

export interface DashboardMetricsParams {
  role?: string;
  period?: 'day' | 'month' | 'year' | string;
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
  if (params?.period) query.append('period', params.period);
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
  period?: 'day' | 'month' | 'year' | string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardCategory(params?: DashboardCategoryParams) {
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/category${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardTeamPerformanceParams {
  period?: 'day' | 'month' | 'year' | string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardTeamPerformance(params?: DashboardTeamPerformanceParams) {
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/team-performance${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardPartsUsageParams {
  period?: 'day' | 'month' | 'year' | string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardPartsUsage(params?: DashboardPartsUsageParams) {
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/parts-usage${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardWorkActivityParams {
  period?: 'day' | 'month' | 'year' | string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardWorkActivity(params?: DashboardWorkActivityParams) {
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/work-activity${qStr ? `?${qStr}` : ''}`);
}

export interface DashboardSymptomsParams {
  period?: 'day' | 'month' | 'year' | string;
  device_type?: string;
  date_start?: string;
  date_end?: string;
}

export function getDashboardSymptoms(params?: DashboardSymptomsParams) {
  const query = new URLSearchParams();
  if (params?.period) query.append('period', params.period);
  if (params?.device_type && params.device_type !== 'all') query.append('device_type', params.device_type);
  if (params?.date_start) query.append('date_start', params.date_start);
  if (params?.date_end) query.append('date_end', params.date_end);
  const qStr = query.toString();
  return api.get(`/dashboard/symptoms${qStr ? `?${qStr}` : ''}`);
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
// GET /api/lookup/profiles?q=...&type=all|name|phone|email
export function lookupProfiles(query: string, type: string = 'all') {
  return api.get(`/lookup/profiles?q=${encodeURIComponent(query)}&type=${type}`);
}

// GET /api/lookup/profiles?name=...&phone=...&email=... (AND กัน — กรองละเอียด)
export function lookupProfilesAdvanced(filters: { name?: string; phone?: string; email?: string }) {
  const params = new URLSearchParams();
  if (filters.name?.trim()) params.append('name', filters.name.trim());
  if (filters.phone?.trim()) params.append('phone', filters.phone.trim());
  if (filters.email?.trim()) params.append('email', filters.email.trim());
  return api.get(`/lookup/profiles?${params.toString()}`);
}

export function getLookupDeviceTypes() {
  return api.get('/lookup/device-types');
}

export function getLookupBrands(deviceTypeId?: number | string) {
  let url = '/lookup/brands';
  if (deviceTypeId) url += `?device_type_id=${deviceTypeId}`;
  return api.get(url);
}

// --- Catalog Management (Manager) ---
export function getCatalogDeviceTypes() {
  return api.get('/catalog/device-types');
}

export function createCatalogDeviceType(data: { device_type_name: string }) {
  return api.post('/catalog/device-types', data);
}

export function updateCatalogDeviceType(id: number | string, data: { device_type_name: string }) {
  return api.put(`/catalog/device-types/${id}`, data);
}

export function deleteCatalogDeviceType(id: number | string) {
  return api.delete(`/catalog/device-types/${id}`);
}

export function getCatalogBrands(deviceTypeId?: number | string, search?: string) {
  let url = '/catalog/brands';
  const params: string[] = [];
  if (deviceTypeId) params.push(`device_type_id=${deviceTypeId}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  return api.get(url);
}

export function createCatalogBrand(data: { brand_name: string; device_type_ids?: number[] }) {
  return api.post('/catalog/brands', data);
}

export function updateCatalogBrand(id: number | string, data: { brand_name: string; device_type_ids?: number[] }) {
  return api.put(`/catalog/brands/${id}`, data);
}

export function deleteCatalogBrand(id: number | string) {
  return api.delete(`/catalog/brands/${id}`);
}

export function getCatalogModels(params?: { brand_id?: number | string; device_type_id?: number | string; search?: string }) {
  let url = '/catalog/models';
  const queryParts: string[] = [];
  if (params?.brand_id) queryParts.push(`brand_id=${params.brand_id}`);
  if (params?.device_type_id) queryParts.push(`device_type_id=${params.device_type_id}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (queryParts.length > 0) url += `?${queryParts.join('&')}`;
  return api.get(url);
}

export function createCatalogModel(data: { model_name: string; brand_id: number; device_type_id: number }) {
  return api.post('/catalog/models', data);
}

export function updateCatalogModel(id: number | string, data: { model_name: string; brand_id: number; device_type_id: number }) {
  return api.put(`/catalog/models/${id}`, data);
}

export function deleteCatalogModel(id: number | string) {
  return api.delete(`/catalog/models/${id}`);
}

export function getLookupModels(brandId?: number | string, deviceTypeId?: number | string) {
  let url = '/lookup/models';
  const params: string[] = [];
  if (brandId) params.push(`brand_id=${brandId}`);
  if (deviceTypeId) params.push(`device_type_id=${deviceTypeId}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  return api.get(url);
}

export function getLookupItemTypes() {
  return api.get('/lookup/item-types');
}

export function getLookupQuotationStatuses() {
  return api.get('/lookup/quotation-statuses');
}

// --- Customer Register by Staff ---
export function registerCustomer(data: {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  password?: string;
}) {
  return api.post('/auth/register', data);
}
