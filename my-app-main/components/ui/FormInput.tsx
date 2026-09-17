// 1. React & React Native
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface FormInputProps extends TextInputProps {
  label: string;
  isFocused: boolean;
  onFieldFocus?: () => void;
  onFieldBlur?: () => void;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string;
}

export default function FormInput({
  label,
  isFocused,
  onFieldFocus,
  onFieldBlur,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  error,
  ...textInputProps
}: FormInputProps) {
  return (
    <View className="mb-5">
      <Text className="text-[15px] text-slate-800 mb-2 font-bold">{label}</Text>
      <View
        className={`flex-row items-center bg-white border-2 rounded-2xl px-4 min-h-[56px] ${
          error ? 'border-red-500 bg-red-50/40' : isFocused ? 'border-[#DC2626] bg-white shadow-sm shadow-red-100' : 'border-slate-200'
        }`}
      >
        <TextInput
          className="flex-1 py-3 text-slate-900 text-[16px] leading-6"
          placeholderTextColor="#94a3b8"
          onFocus={onFieldFocus}
          onBlur={onFieldBlur}
          {...textInputProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            className="p-3 -mr-2 justify-center items-center"
            onPress={onTogglePassword}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View className="flex-row items-center gap-1 mt-1.5 ml-1">
          <Ionicons name="alert-circle" size={14} color="#DC2626" />
          <Text className="text-[#B91C1C] text-[13px] font-medium">{error}</Text>
        </View>
      )}
    </View>
  );
}
