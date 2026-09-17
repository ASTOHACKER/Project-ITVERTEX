import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export default function ProfileHeader({ name, role, avatarUrl }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUri(avatarUrl || null);
  }, [avatarUrl]);

  return (
    <View className="bg-primary px-6 pb-8 items-center" style={{ paddingTop: insets.top + 10 }}>
      <Text className="text-2xl font-heading text-white self-start">IT VERTEX</Text>

      <View className="items-center mt-4">
        {/* Avatar */}
        <View className="w-[110px] h-[110px] rounded-full bg-white mb-4 justify-center items-center shadow-md overflow-hidden">
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="w-[110px] h-[110px] rounded-full" />
          ) : (
            <Text className="text-[44px] font-heading font-bold text-primary">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>

        {/* Name */}
        <Text className="text-xl font-heading text-white font-bold mb-2">{name}</Text>

        {/* Role Badge */}
        <View className="bg-white/25 px-4 py-1.5 rounded-full">
          <Text className="text-[13px] font-heading text-white font-bold">{role}</Text>
        </View>
      </View>
    </View>
  );
}
