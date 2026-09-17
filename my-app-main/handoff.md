# 📋 ITVertex - Project Handoff Document

> **เอกสารส่งมอบงานโปรเจกต์ (Handoff Document)**
> **แอปพลิเคชัน:** ITVertex (Mobile Application สำหรับบริหารจัดการร้านซ่อมคอมพิวเตอร์และอุปกรณ์ไอที)
> **ปรับปรุงล่าสุด:** 6 สิงหาคม 2026

---

## 📌 1. ภาพรวมโปรเจกต์ (Project Overview)

**ITVertex** เป็นระบบบริหารจัดการงานซ่อมคอมพิวเตอร์ สมาร์ตโฟน และอุปกรณ์ไอทีสำหรับร้านซ่อม ช่วยให้ช่างและเจ้าของร้านสามารถรับเครื่อง ติดตามสถานะงานซ่อม จัดการข้อมูลลูกค้า พนักงาน ออกใบเสร็จรับเงิน/ใบเสนอราคา ตรวจสอบสลิปโอนเงิน และบันทึกประวัติการบริการได้อย่างเป็นระบบผ่านแอปพลิเคชันมือถือ

แอปแบ่งพื้นที่ใช้งานตามบทบาท (Role):
* **พนักงานทั่วไป/ช่าง (`(tabs)`)**: รับเครื่อง ตรวจสอบสถานะ ดูประวัติลูกค้า สลิป และออกใบเสร็จ
* **ผู้จัดการ/Manager (`(meneger)`)**: Dashboard วิเคราะห์รายรับ, จัดการงานซ่อม, จัดการอะไหล่/สต็อก, จัดการพนักงาน

---

## 🛠️ 2. เทคโนโลยีที่ใช้ (Tech Stack)

* **Core Framework:** Expo SDK 54 (React Native 0.81.5, React 19.1)
* **Routing & Navigation:** Expo Router v6 (File-based Routing) + React Navigation
* **Backend & Database:** Supabase (Authentication, PostgreSQL, Row Level Security, Storage, Security Definer RPCs)
* **Styling System:** NativeWind v4 (TailwindCSS 3.4) ร่วมกับ React Native `StyleSheet` (ธีมหลัก Crimson Red `#D32F2F`)
* **Security & SAST:** OpenAI Codex Security SDK (`@openai/codex-security` v0.1.7) สำหรับสแกนช่องโหว่ซอร์สโค้ด
* **Toast & Notification:** Custom Animated `SuccessToast` (`components/Signin_out_toast/SuccessToast.tsx`)
* **Signature System:** `react-native-signature-canvas` (WebView-based wrapper `components/signature/SignaturePad.tsx`)
* **PDF & Printing:** `expo-print`, `expo-sharing` (ใบเสร็จ, ใบเสนอราคา)
* **External Integration:** SlipOK API (ตรวจสอบสลิปธนาคารอัตโนมัติ)
* **Typography:** Global **Kanit** Font (รองรับ Web & Mobile)

---

## 📂 3. โครงสร้างโปรเจกต์ (Directory Structure)

```text
my-app/
├── app/                          # แอปพลิเคชัน routing (Expo Router)
│   ├── (auth)/                   # หน้าจอยืนยันตัวตน
│   │   ├── login.tsx             # หน้า Login + Form ลงทะเบียน (มี Real-time Validation)
│   │   ├── forgot-password.tsx    # หน้าขอลิงก์ตั้งรหัสผ่านใหม่ (Responsive Design + Header Red Theme)
│   │   └── reset-password.tsx    # หน้าตั้งรหัสผ่านใหม่
│   ├── (tabs)/                   # พื้นที่พนักงาน/ช่าง
│   │   ├── index.tsx             # Dashboard งานซ่อม + Filter สถานะ/ช่าง/ช่วงเวลา
│   │   ├── receive.tsx           # ฟอร์มรับเครื่องซ่อมเข้าระบบใหม่
│   │   ├── customer.tsx          # รายชื่อและประวัติลูกค้า
│   │   ├── employee.tsx          # รายชื่อพนักงานและช่างซ่อม
│   │   ├── report.tsx            # สรุปรายรับและสถิติงานซ่อม
│   │   └── settings.tsx          # ตั้งค่าระบบ + ปุ่มออกจากระบบพร้อม SuccessToast
│   ├── (meneger)/                # พื้นที่ Manager (กันด้วย role = 'Manager')
│   │   ├── index.tsx             # Dashboard ผู้บริหาร (MetricCards, TrendChart, CategoryChart)
│   │   ├── repairs.tsx           # รายการงานซ่อมของผู้จัดการ
│   │   ├── staff.tsx             # จัดการพนักงาน/ช่าง
│   │   ├── item.tsx              # จัดการอะไหล่และคลังสต็อก
│   │   └── profile.tsx           # โปรไฟล์ผู้จัดการ + ปุ่มออกจากระบบพร้อม SuccessToast
│   ├── _layout.tsx               # Root Layout & Stack Screen Config
│   └── ...                       # หน้าเสริม (job-detail, receipt, edit-job, slips ฯลฯ)
├── components/                   # Reusable UI Components
│   ├── Signin_out_toast/         # 🌟 Custom Toast Component สำหรับแจ้งเตือน Signin/Signout
│   │   └── SuccessToast.tsx
│   ├── Meneger_Dashbord/         # Components สำหรับหน้า Dashboard ของผู้จัดการ
│   ├── Meneger_item/             # Modals จัดการอะไหล่
│   ├── Meneger_profile/          # Components หน้าโปรไฟล์ผู้จัดการ
│   ├── Meneger_repairs/          # Modals รายละเอียดงานซ่อม
│   ├── Meneger_staff/            # Modals และบัตรข้อมูลพนักงาน
│   └── signature/                # ระบบวาดลายเซ็นดิจิทัล
├── codex-security/               # 🌟 OpenAI Codex Security SDK (Built & Ready to scan)
├── supabase/                     # Database Migrations & Schemas
│   └── migrations/               # SQL Migration Scripts (RLS & RPC Functions)
├── constants/theme.ts            # Color Palette (#D32F2F) และสไตล์ระบบ
├── lib/supabase.ts               # Supabase Client Setup
└── README.md                     # เอกสารกำกับการใช้งานแอปพลิเคชัน
```

---

## 🗄️ 4. ฐานข้อมูลและ Security Architecture

* **Supabase PostgreSQL Table Schemas:** `customer`, `device`, `repair_job`, `profiles`, `employee`, `slips`, `error_logs`
* **RPC Security Definer Functions:**
  - `is_username_taken(text)` — ตรวจสอบการใช้งาน Username ซ้ำขณะลงทะเบียน
  - `is_email_taken(text)` — ตรวจสอบการใช้งาน Email ซ้ำขณะลงทะเบียน
* **Row Level Security (RLS):** กำหนดสิทธิ์ตามบทบาท `Manager`, `Staff`, `Customer`

---

## 🚀 5. รายการการปรับปรุงล่าสุด (Recent Progress & Changes)

1. **ปรับปรุงระบบ Technician (`(technicain)`):**
   - นำเข้าหน้าจอช่าง (`index.tsx`, `checking.tsx`, `repairing.tsx`) พร้อมเชื่อมต่อ Supabase Database
   - เพิ่ม Role Routing & Guard สำหรับช่าง (`Tech` / `Technician`) ให้ระบบเปลี่ยนเส้นทางอย่างถูกต้อง
   - อัปเดต `app/(technicain)/profile.tsx` และ `edit-profile.tsx` ให้มีดีไซน์และฟังก์ชันการเปลี่ยนรูปโปรไฟล์/อัปเดตข้อมูลตรงกับ Manager
   - ซ่อนซับรูท `edit-profile` ใน `app/(technicain)/_layout.tsx` (`href: null`) เพื่อไม่ให้หลุดโผล่มาบน Bottom Navigation Bar
2. **แก้ไขปัญหาการดึงข้อมูลและกำจัด Mockup ออกจากระบบ (`app/detail.tsx` & Components):**
   - เปลี่ยนจากการใช้ข้อมูลสมมุติ (Mockup) ใน `CustomerInfoCard.tsx` (เช่น `somchai@email.com`) และ `SignaturesCard.tsx` (เช่น `สาวิตรี ใจดี`) เป็นการดึงข้อมูลจริงจาก Supabase Database
   - ปรับปรุงการค้นหางานซ่อมให้รองรับทั้งตาราง `repair_jobs` (ค้นหาด้วย `job_number` เช่น `REP-260616-412`) และตาราง `repair_job` (ค้นหาด้วย `job_id` ตัวเลข เช่น `REP-003001` หรือ `3001`)
   - แก้ไขสาเหตุที่ทำให้หน้าจอแสดงผล "ไม่พบข้อมูลงานซ่อม" เมื่อดึงข้อมูลตาม `job_no` จากหน้าช่างเทคนิค
   - รองรับการแสดงผลอีเมลลูกค้า, พนักงานรับเรื่อง, ช่างตรวจ/ช่างซ่อม และลายเซ็นจริงจาก DB
3. **ปรับปรุงหน้า Forgot Password (`app/(auth)/forgot-password.tsx`):**
   - เปลี่ยน UI ให้เข้ากับธีม Login (หัวสีแดง `#D32F2F`, White Floating Card, Responsive Design)
4. **ย้ายและปรับปรุง Toast Component (`components/Signin_out_toast/SuccessToast.tsx`):**
   - ย้ายตำแหน่งไฟล์ไปไว้ในโฟลเดอร์ `Signin_out_toast/`
   - แก้ไข import path ในทุกส่วนที่อ้างอิงถึง
5. **ติดตั้งและ Compile OpenAI Codex Security SDK (`codex-security/`):**
   - Build TypeScript dist ใน `codex-security/sdk/typescript` สำเร็จ พร้อมสั่งรันสแกนซอร์สโค้ดผ่าน CLI ได้ทันที

---

## 🔑 6. บัญชีทดสอบระบบ (Test Accounts)

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) |
|---|---|---|
| **Customer / General Test** | `test@gmail.com` | `test123` |
| **Customer Test 1** | `test1@gmail.com` | `test123` |

---

## 🏃 7. คำสั่งการรันและทดสอบ (Commands)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มต้นใช้งาน Expo Dev Server
npx expo start

# 3. รันแยกตาม Platform
npm run android    # Android
npm run ios        # iOS
npm run web        # Web Browser

# 4. รัน Security Scan ผ่าน Codex Security CLI
node "C:\Users\narudom\pjone\my-app\codex-security\sdk\typescript\bin\codex-security.mjs" scan
```
