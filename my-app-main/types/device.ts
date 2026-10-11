// types/device.ts

export interface DeviceItem {
  device_id: number;
  customer_id?: string | null;
  device_type_id?: number | null;
  device_type_name?: string;
  brand_id?: number | null;
  brand_name?: string;
  model: string;
  serial_number?: string;
  included_accessories?: string;
  warranty_year?: number;
  warranty_end_date?: string | null;
  important_software?: string;
  device_password?: string;
  created_at?: string;
}

export interface DeviceTypeItem {
  device_type_id: number;
  device_type_name: string;
}

export interface BrandItem {
  brand_id: number;
  brand_name: string;
}

export interface DeviceModelItem {
  model_id: number;
  model_name: string;
  brand_id?: number;
  device_type_id?: number;
}

export interface CatalogDeviceType {
  device_type_id: number;
  device_type_name: string;
  brand_count?: number;
  model_count?: number;
  device_count?: number;
}

export interface CatalogBrand {
  brand_id: number;
  brand_name: string;
  device_types: { device_type_id: number; device_type_name: string }[];
  model_count?: number;
}

export interface CatalogModel {
  model_id: number;
  model_name: string;
  brand_id: number;
  brand_name: string;
  device_type_id: number;
  device_type_name: string;
}

