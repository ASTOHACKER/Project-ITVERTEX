-- ============================================================
-- IT VERTEX - Repair Management System
-- Database Schema for PostgreSQL (pgAdmin)
-- ============================================================

-- ============================================================
-- DROP ตารางเก่า (ถ้ามี) เพื่อสร้างใหม่
-- ============================================================
DROP VIEW IF EXISTS public.repair_jobs_view CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.slips_records CASCADE;
DROP TABLE IF EXISTS public.quotation_details CASCADE;
DROP TABLE IF EXISTS public.quotation CASCADE;
DROP TABLE IF EXISTS public.repair_job_detail CASCADE;
DROP TABLE IF EXISTS public.repair_job CASCADE;
DROP TABLE IF EXISTS public.device CASCADE;
DROP TABLE IF EXISTS public.item CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.item_type CASCADE;
DROP TABLE IF EXISTS public.payment_method CASCADE;
DROP TABLE IF EXISTS public.quotation_status CASCADE;
DROP TABLE IF EXISTS public.action_type CASCADE;
DROP TABLE IF EXISTS public.status CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.device_types CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.symptoms CASCADE;

-- ============================================================
-- 1. Lookup Tables (ตารางอ้างอิง - Master Data)
-- ============================================================

-- 1.1 บทบาทผู้ใช้
CREATE TABLE IF NOT EXISTS public.roles
(
    id serial NOT NULL,
    name text NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- 1.2 สถานะงานซ่อม
CREATE TABLE IF NOT EXISTS public.status
(
    status_id serial NOT NULL,
    status_name text NOT NULL,
    CONSTRAINT status_pkey PRIMARY KEY (status_id)
);

-- 1.3 ประเภท action (log ประวัติงาน)
CREATE TABLE IF NOT EXISTS public.action_type
(
    action_type_id serial NOT NULL,
    action_type_name text NOT NULL,
    CONSTRAINT action_type_pkey PRIMARY KEY (action_type_id)
);

-- 1.4 ประเภทอะไหล่/บริการ
CREATE TABLE IF NOT EXISTS public.item_type
(
    item_type_id serial NOT NULL,
    item_type_name text NOT NULL,
    CONSTRAINT item_type_pkey PRIMARY KEY (item_type_id)
);

-- 1.5 วิธีชำระเงิน
CREATE TABLE IF NOT EXISTS public.payment_method
(
    payment_method_id serial NOT NULL,
    payment_method_name text NOT NULL,
    CONSTRAINT payment_method_pkey PRIMARY KEY (payment_method_id)
);

-- 1.6 สถานะใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation_status
(
    quote_status_id serial NOT NULL,
    quote_status_name text NOT NULL,
    CONSTRAINT quotation_status_pkey PRIMARY KEY (quote_status_id)
);

-- 1.7 ประเภทอุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.device_types
(
    device_type_id serial NOT NULL,
    device_type_name text NOT NULL,
    CONSTRAINT device_types_pkey PRIMARY KEY (device_type_id)
);

-- 1.8 ยี่ห้ออุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.brands
(
    brand_id serial NOT NULL,
    brand_name text NOT NULL,
    CONSTRAINT brands_pkey PRIMARY KEY (brand_id)
);

-- 1.9 รุ่นอุปกรณ์ (Master Lookup)
CREATE TABLE IF NOT EXISTS public.device_models
(
    model_id serial NOT NULL,
    brand_id integer REFERENCES public.brands(brand_id) ON DELETE CASCADE,
    device_type_id integer REFERENCES public.device_types(device_type_id) ON DELETE SET NULL,
    model_name text NOT NULL,
    CONSTRAINT device_models_pkey PRIMARY KEY (model_id),
    CONSTRAINT uq_brand_model UNIQUE (brand_id, model_name)
);


-- ============================================================
-- 2. Main Tables (ตารางหลัก)
-- ============================================================

-- 2.1 ผู้ใช้งาน
CREATE TABLE IF NOT EXISTS public.profiles
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    role_id integer DEFAULT 4,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email)
);

-- 2.2 Token สำหรับลืมรหัสผ่าน
CREATE TABLE IF NOT EXISTS public.password_reset_tokens
(
    id serial NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_tokens_token_key UNIQUE (token)
);

-- 2.3 อุปกรณ์ลูกค้า
CREATE TABLE IF NOT EXISTS public.device
(
    device_id serial NOT NULL,
    customer_id uuid,
    device_type_id integer,
    brand_id integer,
    model text,
    included_accessories text,
    warranty_year integer DEFAULT 0,
    warranty_end_date date,
    serial_number text,
    important_software text,
    device_password text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT device_pkey PRIMARY KEY (device_id)
);

-- 2.4 อะไหล่ / บริการ
CREATE TABLE IF NOT EXISTS public.item
(
    item_id serial NOT NULL,
    item_name text NOT NULL,
    item_type_id integer,
    selling_price numeric(10, 2) DEFAULT 0,
    CONSTRAINT item_pkey PRIMARY KEY (item_id)
);

-- 2.5 งานซ่อม
CREATE TABLE IF NOT EXISTS public.repair_job
(
    job_id serial NOT NULL,
    device_id integer,
    quotation_id integer,
    symptom_details text,
    appointment_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    customer_send_signature text,
    customer_receive_signature text,
    staff_receive_signature text,
    tech_inspect_signature text,
    tech_repair_signature text,
    total_amount numeric(10, 2) DEFAULT 0,
    slip_image text,
    payment_date date,
    payment_method_id integer,
    payment_verified boolean DEFAULT false,
    payment_verified_by uuid,
    payment_verified_at timestamp with time zone,
    payment_reject_reason text,
    status_id integer DEFAULT 1,
    actual_symptom text,
    repairer_id uuid,
    repaired_at timestamp with time zone,
    return_date timestamp with time zone,
    CONSTRAINT repair_job_pkey PRIMARY KEY (job_id)
);

-- 2.6 ประวัติ action ของงานซ่อม
CREATE TABLE IF NOT EXISTS public.repair_job_detail
(
    job_id_detail serial NOT NULL,
    job_id integer,
    user_id uuid,
    action_type_id integer,
    action_date date DEFAULT CURRENT_DATE,
    remark text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT repair_job_detail_pkey PRIMARY KEY (job_id_detail)
);

-- 2.7 ใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation
(
    quotation_id serial NOT NULL,
    job_id integer,
    total_repair_price numeric(10, 2) DEFAULT 0,
    total_cancel_price numeric(10, 2) DEFAULT 0,
    quote_status_id integer DEFAULT 1,
    customer_remark text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotation_pkey PRIMARY KEY (quotation_id)
);

-- 2.8 รายละเอียดใบเสนอราคา
CREATE TABLE IF NOT EXISTS public.quotation_details
(
    details_id serial NOT NULL,
    quote_id integer,
    item_id integer,
    quantity numeric(10, 2) DEFAULT 1,
    unit_price numeric(10, 2) DEFAULT 0,
    total_price numeric(10, 2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quotation_details_pkey PRIMARY KEY (details_id)
);

-- 2.9 บันทึกสลิปการชำระเงิน
CREATE TABLE IF NOT EXISTS public.slips_records
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    image_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slips_records_pkey PRIMARY KEY (id)
);


-- ============================================================
-- 3. Foreign Keys (ความสัมพันธ์)
-- ============================================================

ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles (id);
ALTER TABLE IF EXISTS public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types (device_type_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.device ADD CONSTRAINT device_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands (brand_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.item ADD CONSTRAINT item_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_type (item_type_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device (device_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT fk_repair_job_quotation FOREIGN KEY (quotation_id) REFERENCES public.quotation (quotation_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_method (payment_method_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status (status_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_repairer_id_fkey FOREIGN KEY (repairer_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job ADD CONSTRAINT repair_job_payment_verified_by_fkey FOREIGN KEY (payment_verified_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.quotation ADD CONSTRAINT quotation_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job (job_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.quotation ADD CONSTRAINT quotation_quote_status_id_fkey FOREIGN KEY (quote_status_id) REFERENCES public.quotation_status (quote_status_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.quotation_details ADD CONSTRAINT quotation_details_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotation (quotation_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.quotation_details ADD CONSTRAINT quotation_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item (item_id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.repair_job (job_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_action_type_id_fkey FOREIGN KEY (action_type_id) REFERENCES public.action_type (action_type_id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repair_job_detail ADD CONSTRAINT repair_job_detail_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.slips_records ADD CONSTRAINT slips_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE SET NULL;


-- ============================================================
-- 4. View: repair_jobs_view
-- ============================================================

CREATE OR REPLACE VIEW public.repair_jobs_view AS
SELECT
    rj.job_id AS id,
    'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_number,
    COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS customer_name,
    COALESCE(p.phone, '') AS phone,
    COALESCE(p.email, '') AS email,
    COALESCE(dt.device_type_name, '') AS device_type,
    COALESCE(b.brand_name, '') AS brand,
    COALESCE(d.model, '') AS model,
    COALESCE(d.serial_number, '') AS serial_number,
    COALESCE(d.included_accessories, '') AS accessories,
    COALESCE(d.important_software, '') AS important_programs,
    COALESCE(d.device_password, '') AS password,
    d.warranty_year AS warranty_years,
    d.warranty_end_date,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ') AS symptoms,
    COALESCE(rj.symptom_details, 'ไม่ระบุอาการ') AS symptom_details,
    COALESCE(s.status_name, 'ไม่ระบุ') AS status,
    rj.status_id,
    rj.total_amount,
    rj.payment_date,
    rj.slip_image,
    rj.staff_receive_signature,
    rj.tech_inspect_signature,
    rj.tech_repair_signature,
    rj.customer_send_signature,
    rj.customer_receive_signature,
    rj.appointment_date,
    rj.created_at,
    rj.device_id,
    rj.quotation_id,
    rj.payment_method_id,
    COALESCE(pm.payment_method_name, '') AS payment_method_name,
    d.customer_id,
    q.customer_remark
FROM public.repair_job rj
LEFT JOIN public.device d ON rj.device_id = d.device_id
LEFT JOIN public.device_types dt ON d.device_type_id = dt.device_type_id
LEFT JOIN public.brands b ON d.brand_id = b.brand_id
LEFT JOIN public.profiles p ON d.customer_id = p.id
LEFT JOIN public.status s ON rj.status_id = s.status_id
LEFT JOIN public.payment_method pm ON rj.payment_method_id = pm.payment_method_id
LEFT JOIN public.quotation q ON rj.quotation_id = q.quotation_id;


-- ============================================================
-- 5. Seed Data (ข้อมูลเริ่มต้น - Master Lookup Data)
-- ============================================================

-- 5.1 บทบาทผู้ใช้ (Roles)
INSERT INTO public.roles (id, name) VALUES 
(1, 'Manager'),
(2, 'Technician'),
(3, 'Staff'),
(4, 'Customer')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 5.2 สถานะงานซ่อม (Status)
INSERT INTO public.status (status_id, status_name) VALUES
(1, 'รอตรวจเช็ค'),
(2, 'ดำเนินการตรวจเช็ค'),
(3, 'ดำเนินการเสนอราคา'),
(4, 'รอการอนุมัติ'),
(5, 'อนุมัติแล้ว/รอซ่อม'),
(6, 'กำลังซ่อม'),
(7, 'รอชำระ'),
(8, 'เสร็จสิ้น'),
(9, 'ยกเลิกซ่อม')
ON CONFLICT (status_id) DO UPDATE SET status_name = EXCLUDED.status_name;

-- 5.3 สถานะใบเสนอราคา (Quotation Status)
INSERT INTO public.quotation_status (quote_status_id, quote_status_name) VALUES
(1, 'รอการอนุมัติ'),
(2, 'อนุมัติแล้ว'),
(3, 'ยกเลิก'),
(4, 'ปรับปรุงใบเสนอราคา'),
(5, 'ขอแก้ไข/เพิ่มเติมรายการ')
ON CONFLICT (quote_status_id) DO UPDATE SET quote_status_name = EXCLUDED.quote_status_name;

-- 5.4 วิธีชำระเงิน (Payment Methods)
INSERT INTO public.payment_method (payment_method_id, payment_method_name) VALUES
(1, 'เงินสด (Cash)'),
(2, 'โอนเงิน / สแกน QR (Transfer)')
ON CONFLICT (payment_method_id) DO UPDATE SET payment_method_name = EXCLUDED.payment_method_name;

-- 5.5 ประเภท Action ประวัติการซ่อม (Action Types)
INSERT INTO public.action_type (action_type_id, action_type_name) VALUES
(1, 'รับเครื่องซ่อม'),
(2, 'เริ่มตรวจเช็คสภาพเครื่อง'),
(3, 'ออกใบเสนอราคา'),
(4, 'เริ่มดำเนินการซ่อม'),
(5, 'ซ่อมเสร็จสิ้น / ทดสอบเครื่อง'),
(6, 'รับชำระเงิน'),
(7, 'ส่งมอบเครื่องให้ลูกค้า'),
(8, 'ยกเลิกการซ่อม')
ON CONFLICT (action_type_id) DO UPDATE SET action_type_name = EXCLUDED.action_type_name;

-- 5.6 ประเภทอะไหล่/บริการ (Item Types)
INSERT INTO public.item_type (item_type_id, item_type_name) VALUES
(1, 'อะไหล่ (Hardware/Part)'),
(2, 'ค่าบริการ (Service Fee)')
ON CONFLICT (item_type_id) DO UPDATE SET item_type_name = EXCLUDED.item_type_name;

-- 5.7 ประเภทอุปกรณ์ (Device Types)
INSERT INTO public.device_types (device_type_id, device_type_name) VALUES
(1, 'Notebook / Laptop'),
(2, 'Desktop PC'),
(3, 'All-in-One PC'),
(4, 'Monitor'),
(5, 'Printer / Scanner'),
(6, 'Other')
ON CONFLICT (device_type_id) DO UPDATE SET device_type_name = EXCLUDED.device_type_name;

-- 5.8 ยี่ห้ออุปกรณ์ (Brands)
INSERT INTO public.brands (brand_id, brand_name) VALUES
-- โน้ตบุ๊ก / คอมพิวเตอร์ / ออลอินวัน
(1, 'ASUS'),
(2, 'Acer'),
(3, 'Dell'),
(4, 'HP'),
(5, 'Lenovo'),
(6, 'Apple'),
(7, 'MSI'),
(8, 'Huawei'),
(9, 'Microsoft Surface'),
(10, 'Samsung'),
(11, 'Gigabyte'),
(12, 'Alienware'),
(13, 'Razer'),
(14, 'Custom PC / ประกอบเอง'),
-- จอภาพ (Monitors)
(15, 'LG'),
(16, 'BenQ'),
(17, 'ViewSonic'),
(18, 'AOC'),
(19, 'Philips'),
-- เครื่องพิมพ์ (Printers)
(20, 'Epson'),
(21, 'Canon'),
(22, 'Brother'),
(23, 'Pantum'),
(24, 'Ricoh'),
(25, 'Fuji Xerox')
ON CONFLICT (brand_id) DO UPDATE SET brand_name = EXCLUDED.brand_name;

-- 5.8.1 รุ่นอุปกรณ์ (Device Models)
INSERT INTO public.device_models (brand_id, device_type_id, model_name) VALUES
-- ASUS (1)
(1, 1, 'ROG Strix G15 / G16'),
(1, 1, 'TUF Gaming A15 / F15'),
(1, 1, 'ZenBook 14 OLED'),
(1, 1, 'VivoBook 15 / S14'),
(1, 2, 'ROG Strix GT35'),
-- Acer (2)
(2, 1, 'Nitro 5 / Nitro 16'),
(2, 1, 'Predator Helios 300 / 16'),
(2, 1, 'Aspire 3 / 5 / 7'),
(2, 1, 'Swift Go 14 / Swift 3'),
(2, 3, 'Aspire C24 All-in-One'),
-- Dell (3)
(3, 1, 'Inspiron 15 / 14'),
(3, 1, 'XPS 13 / 15 / 16'),
(3, 1, 'G15 / G16 Gaming'),
(3, 1, 'Latitude 3420 / 5420'),
(3, 2, 'OptiPlex 7090 Tower'),
-- HP (4)
(4, 1, 'Victus 15 / 16'),
(4, 1, 'OMEN 16 / 17'),
(4, 1, 'Pavilion 14 / 15'),
(4, 1, 'Envy x360 14'),
(4, 3, 'HP 24 All-in-One PC'),
-- Lenovo (5)
(5, 1, 'LOQ 15 / 16'),
(5, 1, 'Legion 5 / Pro 7'),
(5, 1, 'IdeaPad Gaming 3 / Slim 3'),
(5, 1, 'ThinkPad E14 / X1 Carbon'),
(5, 2, 'Legion Tower 5i'),
-- Apple (6)
(6, 1, 'MacBook Air M1 / M2 / M3'),
(6, 1, 'MacBook Pro 14 / 16 (M-Series)'),
(6, 3, 'iMac 24-inch (M-Series)'),
(6, 2, 'Mac mini (M-Series)'),
(6, 2, 'Mac Studio'),
-- MSI (7)
(7, 1, 'Katana 15 / GF63 Thin'),
(7, 1, 'Stealth 16 / Raider GE78'),
(7, 1, 'Modern 14 / 15'),
-- Custom PC (14)
(14, 2, 'Custom Gaming PC'),
(14, 2, 'Custom Office Desktop')
ON CONFLICT (brand_id, model_name) DO NOTHING;

-- 5.9 รายการอะไหล่และค่าบริการทั้งหมด (สอดคล้องกับประเภทอุปกรณ์และยี่ห้อ)
INSERT INTO public.item (item_id, item_name, item_type_id, selling_price) VALUES
-- [หมวดอะไหล่: item_type_id = 1]
(1, 'RAM DDR4 8GB Kingston/Corsair 3200MHz (PC/NB)', 1, 950.00),
(2, 'RAM DDR4 16GB Kingston/Corsair 3200MHz (PC/NB)', 1, 1690.00),
(3, 'RAM DDR5 16GB Kingston Fury 5600MHz', 1, 2450.00),
(4, 'SSD M.2 NVMe 500GB PCIe 4.0 (Kingston/WD)', 1, 1550.00),
(5, 'SSD M.2 NVMe 1TB PCIe 4.0 (Kingston/WD/Samsung)', 1, 2590.00),
(6, 'SSD SATA III 2.5" 512GB (Kingston/Hikvision)', 1, 1390.00),
(7, 'พาวเวอร์ซัพพลาย 650W 80+ Bronze (Corsair/Cooler Master)', 1, 1850.00),
(8, 'พาวเวอร์ซัพพลาย 750W 80+ Gold (Corsair/Thermaltake)', 1, 3190.00),
(9, 'พัดลมเคสระบายความร้อน 120mm ARGB Pack 3', 1, 790.00),
(10, 'ชุดพัดลมระบายความร้อน CPU Air Cooler (Deepcool/Thermalright)', 1, 890.00),
(11, 'ชุดระบายความร้อนด้วยน้ำ CPU 240mm Liquid Cooler', 1, 2390.00),
(12, 'จอแสดงผล Notebook 14.0" Full HD IPS 60Hz (Slim 30-Pin)', 1, 1950.00),
(13, 'จอแสดงผล Notebook 15.6" Full HD IPS 144Hz (Gaming 40-Pin)', 1, 2650.00),
(14, 'แบตเตอรี่ Notebook OEM Grade A (Asus/Acer/Dell/HP/Lenovo)', 1, 1450.00),
(15, 'คีย์บอร์ด Notebook (OEM Thai/Eng Backlight)', 1, 850.00),
(16, 'พัดลมระบายความร้อน Notebook (CPU/GPU Fan OEM)', 1, 650.00),
(17, 'อะแดปเตอร์ชาร์จไฟ Notebook 65W Type-C (Universal)', 1, 890.00),
(18, 'อะแดปเตอร์ชาร์จไฟ Notebook 19V 4.74A (Universal)', 1, 690.00),
(19, 'หัวพิมพ์เครื่องพิมพ์ Epson L-Series (Print Head OEM)', 1, 1750.00),
(20, 'ชุดลูกยางดึงกระดาษ Printer (Pickup Roller Kit)', 1, 350.00),
(21, 'กล่องซับหมึกพร้อมชิปรีเซ็ต (Maintenance Box Epson/Canon)', 1, 490.00),
(22, 'บอร์ดจ่ายไฟจอ Monitor (Power Board / Adapter Monitor)', 1, 750.00),
(23, 'การ์ด Wi-Fi 6 + Bluetooth 5.2 PCIe/M.2 (Intel AX200/AX210)', 1, 790.00),
(24, 'ซิลิโคนนำความร้อนเกรดพรีเมียม (Thermal Grease Tube)', 1, 250.00),

-- [หมวดค่าบริการ: item_type_id = 2]
(25, 'ค่าบริการตรวจเช็คสภาพเครื่องเบื้องต้น (Diagnostic Fee)', 2, 300.00),
(26, 'ค่าบริการติดตั้ง Windows, ไดรเวอร์ และโปรแกรมพื้นฐาน', 2, 500.00),
(27, 'ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (PC / All-in-One)', 2, 400.00),
(28, 'ค่าบริการทำความสะอาดฝุ่นและทาซิลิโคนระบายความร้อน (Notebook)', 2, 500.00),
(29, 'ค่าบริการเปลี่ยนและติดตั้งอุปกรณ์ (RAM / SSD / Power Supply / GPU)', 2, 200.00),
(30, 'ค่าบริการเปลี่ยนจอภาพ Notebook / All-in-One PC', 2, 500.00),
(31, 'ค่าบริการเปลี่ยนคีย์บอร์ด / ทัชแพด Notebook', 2, 400.00),
(32, 'ค่าบริการซ่อมเมนบอร์ด / ซ่อมระบบไฟ / ยกเปลี่ยนชิปไอซี', 2, 1500.00),
(33, 'ค่าบริการล้างหัวพิมพ์ / เคลียร์แผ่นซับหมึก / แก้ไขกระดาษติด (Printer)', 2, 350.00),
(34, 'ค่าบริการกู้คืนข้อมูล (Data Recovery เบื้องต้น)', 2, 800.00),
(35, 'ค่าบริการเซ็ตอัพระบบเน็ตเวิร์ก / แชร์เครื่องพิมพ์ (Wi-Fi & LAN Setup)', 2, 400.00)
ON CONFLICT (item_id) DO UPDATE SET 
    item_name = EXCLUDED.item_name,
    item_type_id = EXCLUDED.item_type_id,
    selling_price = EXCLUDED.selling_price;

-- 5.10 ผู้ใช้งานเริ่มต้น (Seed Profiles)
-- รหัสผ่านของทุกบัญชีคือ: <email>Z (เช่น technician1@gmail.comZ, staff1@gmail.comZ, Manager1234@gmai.comZ, cus1@gmail.comZ)
INSERT INTO public.profiles (id, email, password, first_name, last_name, phone, role_id) VALUES
('8d261a41-f06d-4f80-b4f6-8874031419a0', 'Manager1234@gmai.com', '$2a$10$5cseq1UHtfgMQ.jbD.zTRe//MBxSOJYKtQkMLykyukyfirlVZYUam', 'ผู้จัดการ', 'ใจดี', '0698516971', 1),
('364486db-c8f8-427e-9c35-6b39362ac8e6', 'technician1@gmail.com', '$2a$10$KiTnNlS41FgAXp7RbZ5SGeASDmZCvhUAQHPriwY2249ROtvm18AVC', 'ช่าง', 'ใจดี', '0896513966', 2),
('6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 'staff1@gmail.com', '$2a$10$kWjXpL33HCwL52bb5HQcN.6hEQFMRLy3fJBOrwJz89xftFfwJyZYS', 'เสมียน', 'ใจดีมาก', '0698512699', 3),
('319bcdf6-002b-4934-aa7c-10d7f46a4dac', 'cus1@gmail.com', '$2a$10$Yllgh222rcqyyNY.0yinHOJwJa.Z1FZ8TSxWMAX.39YQIFQN1SBlC', 'ลูกค้า', 'ใจดีที่สุด', '0896513688', 4),
('90a82a98-7154-40bb-ad01-f75519a2f71a', 'customer1@gamill.comz', '$2a$10$90K6qsrQE5pq/OtgsdpmxeET3FH8/fu9dcyYuXuUwWuEbMG4IT7fS', 'สมชาย', 'ใจดี', '0654987100', 4)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role_id = EXCLUDED.role_id;

-- ============================================================
-- 6. ปรับ Reset Sequence ของ Serial PK ให้ถูกต้อง
-- ============================================================
SELECT setval('public.roles_id_seq', COALESCE((SELECT MAX(id) FROM public.roles), 1));
SELECT setval('public.status_status_id_seq', COALESCE((SELECT MAX(status_id) FROM public.status), 1));
SELECT setval('public.quotation_status_quote_status_id_seq', COALESCE((SELECT MAX(quote_status_id) FROM public.quotation_status), 1));
SELECT setval('public.payment_method_payment_method_id_seq', COALESCE((SELECT MAX(payment_method_id) FROM public.payment_method), 1));
SELECT setval('public.action_type_action_type_id_seq', COALESCE((SELECT MAX(action_type_id) FROM public.action_type), 1));
SELECT setval('public.item_type_item_type_id_seq', COALESCE((SELECT MAX(item_type_id) FROM public.item_type), 1));
SELECT setval('public.device_types_device_type_id_seq', COALESCE((SELECT MAX(device_type_id) FROM public.device_types), 1));
SELECT setval('public.brands_brand_id_seq', COALESCE((SELECT MAX(brand_id) FROM public.brands), 1));
SELECT setval('public.device_models_model_id_seq', COALESCE((SELECT MAX(model_id) FROM public.device_models), 1));
SELECT setval('public.item_item_id_seq', COALESCE((SELECT MAX(item_id) FROM public.item), 1));
SELECT setval('public.repair_job_job_id_seq', COALESCE((SELECT MAX(job_id) FROM public.repair_job), 1), (SELECT MAX(job_id) IS NOT NULL FROM public.repair_job));
SELECT setval('public.device_device_id_seq', COALESCE((SELECT MAX(device_id) FROM public.device), 1), (SELECT MAX(device_id) IS NOT NULL FROM public.device));
SELECT setval('public.quotation_quotation_id_seq', COALESCE((SELECT MAX(quotation_id) FROM public.quotation), 1), (SELECT MAX(quotation_id) IS NOT NULL FROM public.quotation));
SELECT setval('public.quotation_details_details_id_seq', COALESCE((SELECT MAX(details_id) FROM public.quotation_details), 1), (SELECT MAX(details_id) IS NOT NULL FROM public.quotation_details));
SELECT setval('public.repair_job_detail_job_id_detail_seq', COALESCE((SELECT MAX(job_id_detail) FROM public.repair_job_detail), 1), (SELECT MAX(job_id_detail) IS NOT NULL FROM public.repair_job_detail));

