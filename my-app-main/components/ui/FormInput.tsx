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
      <Text className="text-sm text-slate-500 mb-2 font-semibold">{label}</Text>
      <View
        className={`flex-row items-center bg-white border rounded-xl px-4 h-[52px] ${
          isFocused ? 'border-[#D32F2F]' : error ? 'border-red-500' : 'border-slate-200'
        }`}
      >
        <TextInput
          className="flex-1 h-full text-slate-800 text-base"
          placeholderTextColor="#94a3b8"
          onFocus={onFieldFocus}
          onBlur={onFieldBlur}
          {...textInputProps}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            className="p-2 justify-center items-center"
            onPress={onTogglePassword}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#cbd5e1"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
