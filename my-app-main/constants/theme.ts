/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primaryRedLight = '#DC2626'; // Red-600 for Light Mode
const primaryRedDark = '#F87171';  // Red-400 for Dark Mode

export const Colors: Record<string, any> = {
  light: {
    text: '#0F172A',
    textMuted: '#64748B',
    background: '#FFFFFF',
    card: '#F8FAFC',
    border: '#E2E8F0',
    tint: primaryRedLight,
    primary: primaryRedLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryRedLight,
    tabBackground: '#FFFFFF',
    badge: primaryRedLight,
  },
  dark: {
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    tint: primaryRedDark,
    primary: primaryRedDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryRedDark,
    tabBackground: '#1E293B',
    badge: primaryRedDark,
  },
  // ── Flat color aliases for Manager Dashboard ──
  primary: '#DC2626',
  secondary: '#F97316',
  tertiary: '#FCBF49',
  quaternary: '#E9D8A6',
  background: '#F8F9FA',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textLight: '#64748B',
  pillInactive: '#F1F3F5',
  success: '#16A34A',
  info: '#0284C7',
  warning: '#D97706',
  border: '#E2E8F0',
  status: {
    // ── กลุ่มที่ 1: โทนสีน้ำเงิน/ฟ้า (ขั้นตอนตรวจเช็ค & กำลังซ่อม) ──
    status1: '#0284C7', // 1 รอตรวจเช็ค (Sky Blue)
    status2: '#2563EB', // 2 ดำเนินการตรวจเช็ค (Bright Blue)
    status3: '#4F46E5', // 3 ดำเนินการเสนอราคา (Indigo Blue)
    status5: '#1D4ED8', // 5 อนุมัติแล้ว/รอซ่อม (Royal Blue)

    // ── กลุ่มที่ 2: โทนสีส้ม/อำพัน/เหลือง (ขั้นตอนการรอ & ลูกค้าดำเนินการ) ──
    status4: '#EA580C', // 4 รอการอนุมัติ (Orange - ต้องการความสนใจ)
    status7: '#D97706', // 7 รอชำระ (Amber)
    status6: '#CA8A04', // 6 รอลูกค้ามารับเครื่อง (Warm Gold / Yellow)

    // ── กลุ่มที่ 3: โทนสีเสร็จสิ้น & ปิดงาน ──
    status8: '#16A34A', // 8 เสร็จสิ้น (Emerald Green)
    status9: '#DC2626', // 9 ยกเลิกซ่อม (Crimson Red)
  } as const,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ── Manager Dashboard Theme Extensions (added to Colors above) ──

export const FONTS = {
  heading: 'Prompt-Regular',
  body: 'IBMPlexSansThai-Regular',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
