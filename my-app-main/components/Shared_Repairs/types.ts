/** Shared types for repair job screens */

export interface RepairItem {
  id: string;
  job_no: string;
  customer_name: string;
  phone: string;
  device_type?: string;
  device?: string;
  brand?: string;
  model?: string;
  symptom?: string;
  symptoms?: string;
  symptom_details?: string;
  actual_symptom?: string;
  total_amount?: number;
  created_at?: string;
  status?: string;
  status_id?: number;
  price?: number;
  date?: string;
  technician?: string;
  payment_verified?: boolean;
}

export interface StatusGroup {
  id: string;
  statusId: number;
  title: string;
  color: string;
  items: RepairItem[];
}
