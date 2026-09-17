/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    status1: '#65A30D', // 1 รอตรวจเช็ค (Lime-600: legible, high contrast on light bg)
    status2: '#D97706', // 2 ดำเนินการตรวจเช็ค (Amber-600)
    status3: '#EA580C', // 3 ดำเนินการเสนอราคา (Orange-600: distinct from Amber)
    status4: '#9333EA', // 4 รอการอนุมัติ (Purple-600)
    status5: '#2563EB', // 5 อนุมัติแล้ว/รอซ่อม (Blue-600)
    status6: '#0284C7', // 6 กำลังซ่อม (Sky-600: distinct from Blue)
    status7: '#CA8A04', // 7 รอชำระ (Yellow-600: legible contrast on light)
    status8: '#16A34A', // 8 เสร็จสิ้น (Green-600)
    status9: '#DC2626', // 9 ยกเลิกซ่อม (Red-600)
  } as const,
};

export const StatusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  status1: 'document-text-outline',
  status2: 'search-outline',
  status3: 'calculator-outline',
  status4: 'time-outline',
  status5: 'checkmark-circle-outline',
  status6: 'hammer-outline',
  status7: 'cash-outline',
  status8: 'checkmark-done-circle-outline',
  status9: 'close-circle-outline',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

