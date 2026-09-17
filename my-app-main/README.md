# 📱 IT VERTEX — Frontend Application (Expo & React Native)

แอปพลิเคชันมือถือและเว็บสำหรับระบบบริหารจัดการงานซ่อม **IT VERTEX** พัฒนาด้วย **Expo SDK 54**, **React Native**, **Expo Router v6** และ **NativeWind (Tailwind CSS)**

> 📖 **คู่มือติดตั้งฉบับเต็มและสคริปต์ฐานข้อมูล:**  
> กรุณาอ่านคู่มือหลักของโปรเจกต์ที่ไฟล์ [../README.md](../README.md) เพื่อดูขั้นตอนการเซ็ตอัพฐานข้อมูล PostgreSQL, รัน Backend และขั้นตอนการจำลอง Flow ทั้งหมด

---

## 🚀 เริ่มต้นใช้งานด่วน (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าการเชื่อมต่อ API (Environment Variables)
ระบบเชื่อมต่อ API อัตโนมัติไปที่ `http://localhost:3002/api` เป็นค่าเริ่มต้น  
หากต้องการแก้ไข สามารถสร้างไฟล์ `.env` ที่โฟลเดอร์นี้:
```env
EXPO_PUBLIC_API_URL=http://localhost:3002/api
```

### 3. รันโปรเจกต์
```bash
# รันโหมด Web Browser
npm run web

# หรือเปิด Expo Dev Menu
npx expo start -c
```
เข้าใช้งานผ่านเบราว์เซอร์ที่: **`http://localhost:8081`**

---

## 🔑 บัญชีทดสอบระบบ (Test Accounts)

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) |
|---|---|---|
| **Manager (ผู้จัดการ)** | `Manager1234@gmai.com` | `Manager1234@gmai.comZ` |
| **Technician (ช่างซ่อม)** | `technician1@gmail.com` | `technician1@gmail.comZ` |
| **Staff (พนักงานหน้าร้าน)** | `staff1@gmail.com` | `staff1@gmail.comZ` |
| **Customer (ลูกค้า)** | `cus1@gmail.com` | `cus1@gmail.comZ` |

*(ทุกรหัสผ่านลงท้ายด้วยตัวอักษร `Z` ตัวใหญ่)*

---

## 📂 โครงสร้างหน้าจอ (App Routes)

- `app/(auth)/` — หน้าล็อกอิน, ลงทะเบียน, ลืมรหัสผ่าน
- `app/(staff)/` — พนักงานหน้าร้าน (รับเครื่อง `/receive`, ส่งมอบ `/deliver`, รายการซ่อม `/repairs`)
- `app/(technicain)/` — ช่างซ่อม (รายการซ่อม, ตารางใบเสนอราคา `/repairing`)
- `app/(meneger)/` — ผู้จัดการร้าน (แดชบอร์ด, จัดการอะไหล่ `/item`, จัดการพนักงาน `/staff`)
- `app/(customer)/` — ลูกค้า (ดูประวัติซ่อม, ตรวจสอบและอนุมัติใบเสนอราคา)
- `app/make-quote.tsx` — หน้าออกใบเสนอราคาของช่าง
- `app/deliver-handover.tsx` — หน้าส่งมอบเครื่องพร้อมเซ็นชื่อรับเครื่องแบบดิจิทัล
- `app/verify-payment.tsx` — หน้าจอยืนยันการชำระเงิน
- `app/detail.tsx` — หน้ารายละเอียดงานซ่อมฉบับเต็ม
