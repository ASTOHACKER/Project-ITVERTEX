// types/payment.ts

/**
 * ข้อมูลการชำระเงิน
 */
export interface PaymentData {
  job_id: number | string;
  job_no?: string;
  payment_method: 'cash' | 'transfer';
  payment_method_id?: number;
  payment_method_name?: string;
  pickup_date?: string;
  slip_image?: string | null;
  slip_filename?: string | null;
  payment_verified?: boolean;
  payment_verified_by?: number | string | null;
  payment_verified_at?: string | null;
  payment_reject_reason?: string | null;
  total_amount?: number;
}

/**
 * ประวัติบันทึกสลิป
 */
export interface SlipRecord {
  id: number | string;
  user_id: number | string;
  image_url: string;
  uploaded_at: string;
  user_email?: string;
}
