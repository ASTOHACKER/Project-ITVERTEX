// types/user.ts

export type RoleName = 'Manager' | 'Staff' | 'Technician' | 'Customer' | string;

export interface User {
  id: number | string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role_id: number; // 1 = Manager, 2 = Staff, 3 = Tech, 4 = Customer
  role_name: string;
  created_at?: string;
}

export type StaffRoleThai = 'พนักงาน' | 'ช่าง' | 'ผู้จัดการ' | 'ลูกค้า' | string;

export interface StaffMember {
  id: number | string;
  name: string;
  role: StaffRoleThai;
  phone: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
  created_at?: string;
}
