// 1. React & React Native
import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Text,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'info' | 'logout';

interface SuccessToastProps {
  visible: boolean;
  message: string;
  subtitle?: string;
  type?: ToastType;
  icon?: keyof typeof Ionicons.glyphMap;
  duration?: number;
  showProgress?: boolean;
  onHide: () => void;
}

export default function SuccessToast({
  visible,
  message,
  subtitle,
  type = 'success',
  icon,
  duration = 1600,
  showProgress = true,
  onHide,
}: SuccessToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      progressAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      if (showProgress) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: Math.max(duration - 250, 400),
          useNativeDriver: false,
        }).start();
      }

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

  const getTheme = () => {
    if (type === 'logout') {
      return {
        bg: '#0F172A',
        border: 'border-slate-700/80',
        iconBg: 'bg-red-500/20',
        iconColor: '#F87171',
        defaultIcon: 'log-out-outline' as const,
        progressBg: '#DC2626',
      };
    }
    if (type === 'info') {
      return {
        bg: '#0284C7',
        border: 'border-sky-400/40',
        iconBg: 'bg-white/20',
        iconColor: '#FFFFFF',
        defaultIcon: 'information-circle' as const,
        progressBg: 'rgba(255, 255, 255, 0.6)',
      };
    }
    return {
      bg: '#059669',
      border: 'border-emerald-400/40',
      iconBg: 'bg-white/20',
      iconColor: '#FFFFFF',
      defaultIcon: 'checkmark-circle' as const,
      progressBg: 'rgba(255, 255, 255, 0.6)',
    };
  };

  const theme = getTheme();
  const topPadding = Platform.OS === 'ios' ? 56 : Platform.OS === 'web' ? 24 : 36;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      className="absolute top-0 left-0 right-0 z-[99999] items-center pointer-events-none"
      style={{ paddingTop: topPadding }}
      pointerEvents="none"
    >
      <Animated.View
        className={`rounded-2xl shadow-xl shadow-black/25 elevation-12 max-w-[92%] min-w-[280px] border ${theme.border} overflow-hidden`}
        style={[
          {
            backgroundColor: theme.bg,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View className="flex-row items-center px-4 py-3">
          {/* Glowing Circular Icon */}
          <View className={`w-9 h-9 rounded-full ${theme.iconBg} items-center justify-center mr-3`}>
            <Ionicons name={icon || theme.defaultIcon} size={20} color={theme.iconColor} />
          </View>

          {/* Texts */}
          <View className="flex-1 mr-2">
            <Text className="text-white text-sm font-bold font-heading" numberOfLines={1}>
              {message}
            </Text>
            {subtitle ? (
              <Text className="text-white/80 text-xs font-body mt-0.5" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Dynamic Countdown Progress Bar */}
        {showProgress && (
          <View className="w-full h-1 bg-black/20 overflow-hidden">
            <Animated.View
              style={{
                width: progressWidth,
                height: '100%',
                backgroundColor: theme.progressBg,
              }}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
