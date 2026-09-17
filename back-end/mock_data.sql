-- ============================================================
-- IT VERTEX - Mock Data for Testing
-- ============================================================

-- 1. Devices for Customer 1 and Customer 2
INSERT INTO public.device (
    device_id, customer_id, device_type_id, brand_id, model, 
    included_accessories, warranty_year, warranty_end_date, 
    serial_number, important_software, device_password, created_at
) VALUES
(
    1, '319bcdf6-002b-4934-aa7c-10d7f46a4dac', 1, 1, 'ROG Strix G15', 
    'Adapter 240W, กระเป๋าเป้', 2, CURRENT_DATE + INTERVAL '180 days', 
    'SN-ASUS-202401', 'AutoCAD, Steam, Genshin', '1234', CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    2, '319bcdf6-002b-4934-aa7c-10d7f46a4dac', 1, 2, 'Nitro 5', 
    'สายชาร์จแท้ 135W', 0, NULL, 
    'SN-ACER-99120', 'ไม่มีซอฟต์แวร์สำคัญ ล้างเครื่องได้', '', CURRENT_TIMESTAMP - INTERVAL '8 days'
),
(
    3, '319bcdf6-002b-4934-aa7c-10d7f46a4dac', 2, 3, 'OptiPlex 7090 Tower', 
    'สายไฟ AC Power', 3, CURRENT_DATE + INTERVAL '300 days', 
    'SN-DELL-88219', 'Microsoft Office 365, โปรแกรมบัญชี Express', 'admin@dell', CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
    4, '90a82a98-7154-40bb-ad01-f75519a2f71a', 1, 6, 'MacBook Pro 14 (M-Series)', 
    'หัวชาร์จ MagSafe 67W, กล่อง', 1, CURRENT_DATE + INTERVAL '90 days', 
    'SN-AAPL-44129', 'Final Cut Pro, Logic Pro X', '9999', CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    5, '90a82a98-7154-40bb-ad01-f75519a2f71a', 1, 5, 'Legion 5', 
    'สายชาร์จ 300W', 2, CURRENT_DATE + INTERVAL '120 days', 
    'SN-LNV-55319', 'Visual Studio Code, Premiere Pro', '0000', CURRENT_TIMESTAMP - INTERVAL '4 days'
),
(
    6, '90a82a98-7154-40bb-ad01-f75519a2f71a', 2, 14, 'Custom Gaming PC', 
    'สายไฟ Power, สาย HDMI', 0, NULL, 
    'SN-CUST-10293', 'Blender, Unreal Engine 5', '', CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
    7, '319bcdf6-002b-4934-aa7c-10d7f46a4dac', 1, 1, 'ZenBook 14 OLED', 
    'Adapter Type-C 65W, ซองหนัง', 2, CURRENT_DATE + INTERVAL '240 days', 
    'SN-ASUS-77123', 'Microsoft Office 2021 Pro', 'pass1234', CURRENT_TIMESTAMP - INTERVAL '12 days'
),
(
    8, '90a82a98-7154-40bb-ad01-f75519a2f71a', 5, 4, 'HP Smart Tank 515', 
    'สาย USB Data, สายไฟ AC', 1, CURRENT_DATE + INTERVAL '60 days', 
    'SN-HP-PRN-001', 'HP Smart App Driver', '', CURRENT_TIMESTAMP - INTERVAL '14 days'
);

SELECT setval('device_device_id_seq', 8);

-- 2. Quotations (ใบเสนอราคา)
-- Quotation 1: สำหรับ Job 3 (รออนุมัติ)
INSERT INTO public.quotation (
    quotation_id, job_id, total_repair_price, total_cancel_price, 
    quote_status_id, customer_remark, created_at
) VALUES
(
    1, NULL, 2050.00, 300.00, 1, 'เสนอเปลี่ยน SSD 500GB NVMe + ติดตั้ง Windows และโอนย้ายข้อมูลเดิม', CURRENT_TIMESTAMP - INTERVAL '2 days'
),
-- Quotation 2: สำหรับ Job 4 (อนุมัติแล้ว/รอซ่อม)
(
    2, NULL, 1950.00, 300.00, 2, 'ลูกค้าอนุมัติการเปลี่ยนแบตเตอรี่แท้เรียบร้อย', CURRENT_TIMESTAMP - INTERVAL '3 days'
),
-- Quotation 3: สำหรับ Job 5 (กำลังซ่อม)
(
    3, NULL, 1250.00, 300.00, 2, 'เปลี่ยนแผงคีย์บอร์ดไฟ RGB แท้ตรงรุ่น', CURRENT_TIMESTAMP - INTERVAL '4 days'
),
-- Quotation 4: สำหรับ Job 6 (รอชำระ)
(
    4, NULL, 3390.00, 300.00, 2, 'เปลี่ยนพาวเวอร์ซัพพลาย 750W 80+ Gold ประกัน 5 ปี', CURRENT_TIMESTAMP - INTERVAL '5 days'
),
-- Quotation 5: สำหรับ Job 7 (เสร็จสิ้น)
(
    5, NULL, 3090.00, 300.00, 2, 'อัปเกรด SSD 1TB PCIe 4.0 + ลงระบบปฏิบัติการ', CURRENT_TIMESTAMP - INTERVAL '7 days'
),
-- Quotation 6: สำหรับ Job 8 (เสร็จสิ้น)
(
    6, NULL, 350.00, 300.00, 2, 'ล้างหัวพิมพ์และรีเซ็ตซับหมึก', CURRENT_TIMESTAMP - INTERVAL '8 days'
);

SELECT setval('quotation_quotation_id_seq', 6);

-- 3. Quotation Details (รายการอะไหล่และบริการในใบเสนอราคา)
INSERT INTO public.quotation_details (details_id, quote_id, item_id, quantity, unit_price, total_price, created_at) VALUES
-- Quote 1 (SSD 500GB + ค่าลง Windows)
(1, 1, 4, 1, 1550.00, 1550.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 1, 26, 1, 500.00, 500.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Quote 2 (แบตเตอรี่ + ค่าบริการ)
(3, 2, 14, 1, 1450.00, 1450.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(4, 2, 28, 1, 500.00, 500.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
-- Quote 3 (คีย์บอร์ด + ค่าบริการเปลี่ยน)
(5, 3, 15, 1, 850.00, 850.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(6, 3, 31, 1, 400.00, 400.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
-- Quote 4 (PSU 750W + ค่าติดตั้ง)
(7, 4, 8, 1, 3190.00, 3190.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(8, 4, 29, 1, 200.00, 200.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
-- Quote 5 (SSD 1TB + ค่าลง Windows)
(9, 5, 5, 1, 2590.00, 2590.00, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(10, 5, 26, 1, 500.00, 500.00, CURRENT_TIMESTAMP - INTERVAL '7 days'),
-- Quote 6 (ล้างหัวพิมพ์)
(11, 6, 33, 1, 350.00, 350.00, CURRENT_TIMESTAMP - INTERVAL '8 days');

SELECT setval('quotation_details_details_id_seq', 11);

-- 4. Repair Jobs (งานซ่อม)
INSERT INTO public.repair_job (
    job_id, device_id, quotation_id, symptom_details, actual_symptom,
    appointment_date, created_at, status_id, repairer_id, repaired_at,
    total_amount, payment_date, payment_method_id, payment_verified,
    payment_verified_by, payment_verified_at, return_date
) VALUES
-- Job 1: รอตรวจเช็ค
(
    1, 1, NULL, 
    'เปิดเครื่องไฟติดแต่ไม่ขึ้นภาพบนหน้าจอ พัดลมหมุนแรงขึ้นเรื่อยๆ แล้วดับ', 
    NULL,
    CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '3 hours',
    1, NULL, NULL,
    0.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 2: ดำเนินการตรวจเช็ค
(
    2, 2, NULL, 
    'เครื่องร้อนจัดเวลาเปิดโปรแกรม เล่นเกมแล้วมีเสียงพัดลมดังผิดปกติและกระตุกมาก', 
    'พัดลมฝุ่นอุดตัน ซิลิโคนแห้งแข็ง ต้องทำความสะอาดและทาซิลิโคนเกรดนำความร้อนสูง',
    CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day',
    2, '364486db-c8f8-427e-9c35-6b39362ac8e6', NULL,
    0.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 3: รอการอนุมัติใบเสนอราคา (Quotation 1)
(
    3, 3, 1, 
    'บูตไม่เข้า Windows ขึ้นจอฟ้า Inaccessible Boot Device เปิดเครื่องวนลูป', 
    'SSD ตัวเดิมเสีย มี Bad Sector อ่านข้อมูลไม่ได้ ต้องเปลี่ยนเป็น NVMe 500GB และติดตั้ง Windows 11',
    CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days',
    4, '364486db-c8f8-427e-9c35-6b39362ac8e6', NULL,
    2050.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 4: อนุมัติแล้ว/รอซ่อม (Quotation 2)
(
    4, 4, 2, 
    'แบตเตอรี่บวม ดันฝาหลังเครื่องและทัชแพดจนกดยาก ใช้งานได้ไม่ถึง 20 นาที', 
    'แบตเตอรี่เสื่อมสภาพตามรอบชาร์จ ต้องเปลี่ยนแบตเตอรี่แท้ OEM Grade A',
    CURRENT_DATE + INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days',
    5, '364486db-c8f8-427e-9c35-6b39362ac8e6', NULL,
    1950.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 5: กำลังซ่อม (Quotation 3)
(
    5, 5, 3, 
    'ปุ่มคีย์บอร์ดใช้งานไม่ได้หลายปุ่ม (W, A, S, D, Spacebar, Shift) น้ำหกใส่เล็กน้อย', 
    'แผงคีย์บอร์ดลายวงจรช็อต ต้องเปลี่ยนชุดคีย์บอร์ดใหม่พร้อมไฟแบ็คไลท์',
    CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '4 days',
    6, '364486db-c8f8-427e-9c35-6b39362ac8e6', NULL,
    1250.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 6: รอชำระ (Quotation 4)
(
    6, 6, 4, 
    'เล่นเกมแล้วเครื่องดับวูบ มีกลิ่นไหม้อ่อนๆ บริเวณด้านหลังเคส เปิดไม่ติดอีกเลย', 
    'เพาเวอร์ซัพพลายเสื่อมสภาพ จ่ายไฟตก เปลี่ยนเป็น Corsair 750W 80+ Gold และทดสอบ FurMark ผ่านฉลุย',
    CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '5 days',
    7, '364486db-c8f8-427e-9c35-6b39362ac8e6', CURRENT_TIMESTAMP - INTERVAL '4 hours',
    3390.00, NULL, NULL, false, NULL, NULL, NULL
),
-- Job 7: เสร็จสิ้น (Quotation 5)
(
    7, 7, 5, 
    'ต้องการอัปเกรดพื้นที่จัดเก็บข้อมูลจาก 512GB เป็น 1TB และโอนย้าย Windows และไฟล์งาน', 
    'ติดตั้ง SSD M.2 NVMe 1TB PCIe 4.0 โคลนระบบปฏิบัติการเดิมและปรับแต่งความเร็วเสร็จสมบูรณ์',
    CURRENT_DATE - 1, CURRENT_TIMESTAMP - INTERVAL '7 days',
    8, '364486db-c8f8-427e-9c35-6b39362ac8e6', CURRENT_TIMESTAMP - INTERVAL '2 days',
    3090.00, CURRENT_DATE - 1, 1, true,
    '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
),
-- Job 8: เสร็จสิ้น (Quotation 6)
(
    8, 8, 6, 
    'พิมพ์เอกสารแล้วตัวหนังสือขาดหาย หมึกสีดำไม่ออก ไฟส้มกระพริบเตือนซับหมึกเต็ม', 
    'ล้างระบบหัวพิมพ์สุญญากาศ เคลียร์ท่อหมึกเสีย และรีเซ็ตชิปเคาน์เตอร์แผ่นซับหมึก ทดสอบพิมพ์ 100% ปกติ',
    CURRENT_DATE - 2, CURRENT_TIMESTAMP - INTERVAL '8 days',
    8, '364486db-c8f8-427e-9c35-6b39362ac8e6', CURRENT_TIMESTAMP - INTERVAL '3 days',
    350.00, CURRENT_DATE - 2, 2, true,
    '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

SELECT setval('repair_job_job_id_seq', 8);

-- อัปเดต job_id ในตาราง quotation ให้สัมพันธ์กับ repair_job
UPDATE public.quotation SET job_id = 3 WHERE quotation_id = 1;
UPDATE public.quotation SET job_id = 4 WHERE quotation_id = 2;
UPDATE public.quotation SET job_id = 5 WHERE quotation_id = 3;
UPDATE public.quotation SET job_id = 6 WHERE quotation_id = 4;
UPDATE public.quotation SET job_id = 7 WHERE quotation_id = 5;
UPDATE public.quotation SET job_id = 8 WHERE quotation_id = 6;

-- 5. Repair Job Detail Log (บันทึกประวัติ Timeline แต่ละงาน)
INSERT INTO public.repair_job_detail (job_id, user_id, action_type_id, action_date, remark, created_at) VALUES
-- Job 1
(1, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE, 'พนักงานรับเครื่องซ่อมและออกใบรับเครื่อง', CURRENT_TIMESTAMP - INTERVAL '3 hours'),

-- Job 2
(2, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 1, 'พนักงานรับเครื่องซ่อม', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE, 'ช่างเริ่มตรวจเช็คสภาพเครื่องและวัดอุณหภูมิ', CURRENT_TIMESTAMP - INTERVAL '5 hours'),

-- Job 3
(3, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 2, 'พนักงานรับเครื่องซ่อม', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 2, 'ช่างตรวจเช็คพบว่า SSD เสียหาย', CURRENT_TIMESTAMP - INTERVAL '40 hours'),
(3, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 1, 'ช่างออกใบเสนอราคา (ยอด 2,050 บาท) รอลูกค้าอนุมัติ', CURRENT_TIMESTAMP - INTERVAL '30 hours'),

-- Job 4
(4, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 3, 'รับเครื่อง MacBook Pro', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(4, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 3, 'ตรวจสภาพแบตเตอรี่', CURRENT_TIMESTAMP - INTERVAL '65 hours'),
(4, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 2, 'ออกใบเสนอราคาเปลี่ยนแบตเตอรี่', CURRENT_TIMESTAMP - INTERVAL '50 hours'),

-- Job 5
(5, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 4, 'รับเครื่อง Legion 5', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(5, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 4, 'ตรวจเช็คปุ่มคีย์บอร์ด', CURRENT_TIMESTAMP - INTERVAL '90 hours'),
(5, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 3, 'ออกใบเสนอราคาคีย์บอร์ด', CURRENT_TIMESTAMP - INTERVAL '70 hours'),
(5, '364486db-c8f8-427e-9c35-6b39362ac8e6', 4, CURRENT_DATE - 1, 'เริ่มดำเนินการเปลี่ยนคีย์บอร์ด', CURRENT_TIMESTAMP - INTERVAL '18 hours'),

-- Job 6
(6, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 5, 'รับเคส Gaming PC', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(6, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 5, 'ตรวจเช็คระบบไฟ', CURRENT_TIMESTAMP - INTERVAL '110 hours'),
(6, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 4, 'ออกใบเสนอราคา PSU ใหม่', CURRENT_TIMESTAMP - INTERVAL '90 hours'),
(6, '364486db-c8f8-427e-9c35-6b39362ac8e6', 4, CURRENT_DATE - 2, 'เริ่มติดตั้งพาวเวอร์ซัพพลาย', CURRENT_TIMESTAMP - INTERVAL '40 hours'),
(6, '364486db-c8f8-427e-9c35-6b39362ac8e6', 5, CURRENT_DATE, 'ซ่อมเสร็จสิ้น ทดสอบ Stress Test ผ่าน รอส่งต่อชำระเงิน', CURRENT_TIMESTAMP - INTERVAL '4 hours'),

-- Job 7
(7, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 7, 'รับเครื่อง ZenBook 14', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(7, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 7, 'ตรวจสอบพื้นที่และความเข้ากันได้ของ NVMe', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(7, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 6, 'ออกใบเสนอราคา SSD 1TB', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, '364486db-c8f8-427e-9c35-6b39362ac8e6', 4, CURRENT_DATE - 4, 'ทำการโคลนและติดตั้ง SSD', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(7, '364486db-c8f8-427e-9c35-6b39362ac8e6', 5, CURRENT_DATE - 2, 'ซ่อมเสร็จสิ้นและทดสอบระบบเรียบร้อย', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(7, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 6, CURRENT_DATE - 1, 'รับชำระเงินผ่านการโอนและยืนยันสลิป', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(7, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 7, CURRENT_DATE - 1, 'ส่งมอบเครื่องพร้อมลูกค้าเซ็นรับเครื่อง', CURRENT_TIMESTAMP - INTERVAL '20 hours'),

-- Job 8
(8, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 1, CURRENT_DATE - 8, 'รับเครื่องปริ้นเตอร์ HP', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(8, '364486db-c8f8-427e-9c35-6b39362ac8e6', 2, CURRENT_DATE - 8, 'เช็คอาการหัวพิมพ์และซับหมึก', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(8, '364486db-c8f8-427e-9c35-6b39362ac8e6', 3, CURRENT_DATE - 7, 'เสนอราคาค่าบริการล้างหัวพิมพ์', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(8, '364486db-c8f8-427e-9c35-6b39362ac8e6', 4, CURRENT_DATE - 5, 'ดำเนินการล้างหัวพิมพ์และเคลียร์ซับหมึก', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(8, '364486db-c8f8-427e-9c35-6b39362ac8e6', 5, CURRENT_DATE - 3, 'ทดสอบพิมพ์เรียบร้อย', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(8, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 6, CURRENT_DATE - 2, 'รับชำระเงินสด', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(8, '6c29396b-5636-4d8f-9ca0-f2f8a6f8a40d', 7, CURRENT_DATE - 2, 'ส่งมอบเครื่องปริ้นเตอร์ให้ลูกค้า', CURRENT_TIMESTAMP - INTERVAL '2 days');
