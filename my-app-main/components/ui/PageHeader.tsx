// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PageHeaderProps {
  title?: string;
  onBack?: () => void;
  /** Background color. Default: '#00B4D8' */
  bgColor?: string;
}

/**
 * Shared page header with back button.
 * Replaces HandoverHeader and VerifyHeader.
 */
export default function PageHeader({ title = '', onBack, bgColor = '#00B4D8' }: PageHeaderProps) {
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
      <TouchableOpacity onPress={handleBack} className="mr-3 p-1" activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={26} color="#ffffff" />
      </TouchableOpacity>
      <Text className="text-xl font-bold text-white">{title}</Text>
    </View>
  );
}
