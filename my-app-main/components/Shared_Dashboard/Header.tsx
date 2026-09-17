// 1. React & React Native
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "IT VERTEX",
  subtitle = "ภาพรวมธุรกิจ"
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary px-5 pb-5 shadow-lg z-10 rounded-b-xl"
      style={{ paddingTop: insets.top + 10 }}
    >
      <Text className="text-white text-2xl font-heading">{title}</Text>
      <Text className="text-white/90 text-sm mt-1 font-body">{subtitle}</Text>
    </View>
  );
}