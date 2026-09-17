// 1. React & React Native
import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Platform,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'info';

interface SuccessToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  icon?: keyof typeof Ionicons.glyphMap;
  duration?: number;
  onHide: () => void;
}

export default function SuccessToast({
  visible,
  message,
  type = 'success',
  icon,
  duration = 2000,
  onHide,
}: SuccessToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? '#10b981' : '#3b82f6';
  const defaultIcon = isSuccess ? 'checkmark-circle' : 'information-circle';

  return (
    <View className="absolute inset-0 z-[9999] items-center" style={{ paddingTop: Platform.OS === 'ios' ? 60 : 30 }} pointerEvents="none">
      <Animated.View
        className="flex-row items-center px-5 py-3.5 rounded-[14px] shadow-sm shadow-black/15 elevation-8 max-w-[85%] min-w-[200px]"
        style={[
          {
            backgroundColor: bgColor,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View className="mr-2.5">
          <Ionicons name={icon || defaultIcon} size={20} color="#fff" />
        </View>
        <Text className="text-white text-sm font-semibold shrink" numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}
