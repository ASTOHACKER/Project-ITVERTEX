---
name: IT VERTEX Design System
description: Modern Tech Clean design system for IT Repair Management System across Mobile and Web
colors:
  primary: "#DC2626"
  primary-hover: "#B91C1C"
  primary-subtle: "#FEF2F2"
  neutral-bg: "#F8FAFC"
  card-bg: "#FFFFFF"
  border: "#E2E8F0"
  border-subtle: "#F1F5F9"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-muted: "#94A3B8"
  status-check: "#BAD80A"
  status-checking: "#D97706"
  status-quote: "#F59E0B"
  status-approval: "#A855F7"
  status-approved: "#3B82F6"
  status-repairing: "#0EA5E9"
  status-payment: "#EAB308"
  status-done: "#22C55E"
  status-cancelled: "#EF4444"
typography:
  display:
    fontFamily: "Kanit, Prompt-Regular, sans-serif"
    fontSize: "28px"
    fontWeight: 700
  title:
    fontFamily: "Kanit, Prompt-Regular, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  body:
    fontFamily: "Kanit, IBMPlexSansThai-Regular, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Kanit, Prompt-Regular, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# IT VERTEX Design System

## Overview
IT VERTEX uses a **Modern Tech Clean** visual language tailored for high-volume IT service centers, computer technicians, store staff, and customers. It prioritizes clarity, rapid scanability, error-reduction, and consistent lifecycle feedback across both handheld mobile devices and expansive desktop web views.

## Colors
- **Brand Primary:** `#DC2626` / `#D32F2F` — Crisp crimson red conveying precision and alert responsiveness.
- **Surface & Background:** Clean white `#FFFFFF` on soft slate tint `#F8FAFC` to reduce visual fatigue.
- **Border & Dividers:** Subtle `#E2E8F0` hairline strokes establishing clean compartmentalization without heavy outlines.
- **Semantic Status Palette:**
  - `รอตรวจเช็ค (Pending Check):` `#BAD80A` (Lime/Yellow-Green)
  - `ดำเนินการตรวจเช็ค (Checking):` `#D97706` (Amber-600)
  - `ดำเนินการเสนอราคา (Quoting):` `#F59E0B` (Amber-500)
  - `รอการอนุมัติ (Pending Approval):` `#A855F7` (Purple-500)
  - `อนุมัติแล้ว/รอซ่อม (Approved/Queued):` `#3B82F6` (Blue-500)
  - `กำลังซ่อม (Repairing):` `#0EA5E9` (Sky-500)
  - `รอชำระ (Pending Payment):` `#EAB308` (Yellow-500)
  - `เสร็จสิ้น (Completed):` `#22C55E` (Emerald-500)
  - `ยกเลิกซ่อม (Cancelled):` `#EF4444` (Red-500)

## Typography
- **Headings & Badges:** Kanit / Prompt-Regular — geometric, modern, legible at low and high densities.
- **Body Text:** Kanit / IBMPlexSansThai-Regular — neutral, highly readable with generous line height (1.5).
- **Numbers & Metrics:** Tabular figures, bold weights for key stats and monetary amounts.

## Layout
- **Adaptive Screen Architecture:**
  - Mobile viewports: Single column cards, bottom tab navigation, floating primary actions, minimum 44px touch targets.
  - Tablet/Desktop viewports: Centered container (up to 1200px max width), multi-column metric cards, expansive data tables with responsive horizontal scroll or side-by-side split view.
- **Visual Rhythm:** Consistent 8px grid (8px, 16px, 24px, 32px spacing).

## Elevation & Depth
- Layering over heavy drop-shadows. Soft subtle shadow (`shadow-sm` / `elevation: 2`) with delicate 1px border `#E2E8F0`.
- Active / Elevated modals use `shadow-lg` and semi-transparent backdrop blur (`rgba(15, 23, 42, 0.45)`).

## Shapes
- Cards: `rounded-2xl` (16px) for main containers and modules.
- Form inputs & interactive buttons: `rounded-xl` (12px) for effortless tapping.
- Status badges: `rounded-full` (pill shape) with small colored status indicator dot.

## Components
- **Job Card:** Shows Job No (e.g. `REP-000123`), Customer Name, Device Model, Symptom Summary, Semantic Status Badge, and contextual Role-specific Action Button (e.g. "ตรวจเช็ค", "เสนอราคา", "ชำระเงิน", "ส่งมอบ").
- **Metric Cards:** Clean white tile with colored subtle icon backdrop, bold numeric metric, and clear Thai label.
- **Quotation Builder:** Easy-to-pick parts list, quantity counters, custom item injection, automatic subtotal/vat/total calculation, and sticky submit bar.
- **Handover & Signature:** Seamless customer sign canvas, clear verification checklist, and instant PDF receipt generation.

## Do's and Don'ts
- **DO:** Always display status label text alongside status colors for accessibility.
- **DO:** Provide empty states with friendly guidance and clear CTA when no jobs or data exist.
- **DO:** Show instant feedback (toast / alert) on every state transition.
- **DON'T:** Use harsh, unstyled alerts or cluttered nested cards.
- **DON'T:** Hide crucial customer contact info or device serial numbers from technicians and staff.
