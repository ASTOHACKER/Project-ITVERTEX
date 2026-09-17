// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title?: string;
  onBack?: () => void;
  /** Background color. Default: '#DC2626' (brand) */
  bgColor?: string;
}

/**
 * Shared page header with back button.
 * Replaces HandoverHeader and VerifyHeader.
 */
export default function PageHeader({ title = '', onBack, bgColor = '#DC2626' }: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      className="flex-row items-center px-4 pb-4 shadow-sm shadow-black/10 elevation-4"
      style={{ paddingTop: insets.top + 10, backgroundColor: bgColor }}
    >
      <TouchableOpacity onPress={handleBack} className="mr-2 w-11 h-11 items-center justify-center rounded-full active:bg-white/15" activeOpacity={0.7} accessibilityLabel="ย้อนกลับ">
        <Ionicons name="chevron-back" size={26} color="#ffffff" />
      </TouchableOpacity>
      <Text className="text-[20px] font-bold text-white flex-1" numberOfLines={1}>{title}</Text>
    </View>
  );
}
