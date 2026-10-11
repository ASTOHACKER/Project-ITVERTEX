// types/quotation.ts

/**
 * ข้อมูลหัวใบเสนอราคา (Quotation Header)
 */
export interface QuotationItem {
  quotation_id: number;
  job_id: number;
  quote_no: string;
  job_no: string;
  quote_status_id: number;
  quote_status_name: string;
  repair_status_id: number;
  repair_status_name: string;
  total_repair_price: string | number;
  total_cancel_price: string | number;
  customer_remark: string | null;
  customer_name: string;
  phone: string;
  email?: string;
  brand?: string;
  model?: string;
  device_type?: string;
  symptom_details?: string;
  actual_symptom?: string;
  total_parts: string | number;
  total_services: string | number;
  item_count: string | number;
  created_at: string;
}

/**
 * รายการอะไหล่หรือค่าบริการในใบเสนอราคา (Quotation Line Item)
 * ใช้ร่วมกันทุกหน้าจอ: make-quote, CustomerQuotationCard, detail, receipt
 */
export interface QuotationLineItem {
  id?: string;
  details_id?: number;
  item_id?: number;
  name?: string;
  item_name?: string;
  item_type_id?: number; // 1 = อะไหล่ (Part), 2 = บริการ (Service)
  item_type_name?: string;
  type_name?: string;
  description?: string;
  price?: number;
  unit_price?: number | string;
  qty?: number;
  quantity?: number | string;
  total_price?: number | string;
  amount?: number | string;
}

export type QuotationFilter = 'all' | 'rejected' | 'pending' | 'approved' | 'cancelled';

/**
 * รายการอะไหล่ (Part Item) สำหรับหน้าจัดการใบเสนอราคา
 */
export interface PartItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  item_id?: number;
  item_type_id?: number;
}

/**
 * รายการค่าบริการ (Service Item) สำหรับหน้าจัดการใบเสนอราคา
 */
export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  item_id?: number;
  item_type_id?: number;
}

/**
 * รายการแสดงผลสรุป (Quote Item) สำหรับหน้าตรวจสอบ/ส่งต่อใบเสนอราคา
 */
export interface QuoteItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  item_id?: number;
}
