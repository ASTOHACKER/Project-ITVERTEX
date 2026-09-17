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
  primary: '#D62828',
  secondary: '#F77F00',
  tertiary: '#FCBF49',
  quaternary: '#E9D8A6',
  background: '#F8F9FA',
  white: '#FFFFFF',
  textDark: '#333333',
  textLight: '#888888',
  pillInactive: '#F1F3F5',
  success: '#2D6A4F',
  info: '#0077B6',
  warning: '#E85D04',
  border: '#E9ECEF',
  status: {
    status1: '#BAD80A', // 1 รอตรวจเช็ค
    status2: '#D97706', // 2 ดำเนินการตรวจเช็ค
    status3: '#F59E0B', // 3 ดำเนินการเสนอราคา
    status4: '#A855F7', // 4 รอการอนุมัติ
    status5: '#3B82F6', // 5 อนุมัติแล้ว/รอซ่อม
    status6: '#0EA5E9', // 6 กำลังซ่อม
    status7: '#EAB308', // 7 รอชำระ
    status8: '#22C55E', // 8 เสร็จสิ้น
    status9: '#EF4444', // 9 ยกเลิกซ่อม
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

