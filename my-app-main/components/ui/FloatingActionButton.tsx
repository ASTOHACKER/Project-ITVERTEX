// 1. React & React Native
import { TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps {
  onPress: () => void;
  /** Ionicons icon name. Default: 'add' */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Whether the button is visible. Default: true */
  visible?: boolean;
  /** Bottom offset override. Uses safe area bottom + 24 by default. */
  bottomOffset?: number;
  /** Background color. Default: '#DC2626' (brand) */
  bgColor?: string;
  /** Accessibility label. Default: 'เพิ่มรายการใหม่' */
  label?: string;
}

/**
 * Shared floating action button.
 * Replaces Meneger_item/FloatingButton and Technicain_detail/FloatingEditButton.
 */
export default function FloatingActionButton({
  onPress,
  icon = 'add',
  visible = true,
  bottomOffset,
  bgColor = '#DC2626',
  label = 'เพิ่มรายการใหม่',
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const bottom = bottomOffset ?? insets.bottom + 24;

  return (
    <TouchableOpacity
      className="absolute right-6 w-16 h-16 rounded-full justify-center items-center shadow-md shadow-black/30 elevation-8 z-20"
      style={{ bottom, backgroundColor: bgColor }}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={30} color="#ffffff" />
    </TouchableOpacity>
  );
}
