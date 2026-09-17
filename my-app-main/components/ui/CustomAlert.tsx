// 1. React & React Native
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'success' | 'warning' | 'danger' | 'info';
}

export default function CustomAlert({
  visible,
  title,
  message,
  confirmText = 'ตกลง',
  cancelText,
  onConfirm,
  onCancel,
  type = 'info',
}: CustomAlertProps) {

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={48} color="#16A34A" />;
      case 'warning':
        return <Ionicons name="warning" size={48} color="#D97706" />;
      case 'danger':
        return <Ionicons name="alert-circle" size={48} color="#DC2626" />;
      default:
        return <Ionicons name="information-circle" size={48} color="#0284C7" />;
    }
  };

  const getConfirmBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#DC2626]';
      case 'success':
        return 'bg-emerald-600';
      case 'warning':
        return 'bg-amber-600';
      default:
        return 'bg-[#DC2626]';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/40 justify-center items-center p-6">
        <View className="w-full max-w-[320px] bg-white rounded-2xl p-6 items-center shadow-lg shadow-black/15 elevation-8">
          {/* Header Icon */}
          <View className="mb-3">{getIcon()}</View>

          {/* Texts */}
          <Text className="text-lg font-bold text-slate-800 text-center mb-1.5 font-heading">{title}</Text>
          <Text className="text-sm text-slate-600 text-center mb-5 leading-5 font-body">{message}</Text>

          {/* Action Buttons */}
          <View className="flex-row gap-2.5 w-full">
            {onCancel && cancelText && (
              <TouchableOpacity className="flex-1 bg-slate-100 border border-slate-200 h-11 rounded-xl justify-center items-center active:bg-slate-200" onPress={onCancel}>
                <Text className="text-slate-700 text-sm font-bold font-heading">{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={`flex-1 h-11 rounded-xl justify-center items-center shadow-sm active:opacity-90 ${getConfirmBg()}`}
              onPress={onConfirm}
            >
              <Text className="text-white text-sm font-bold font-heading">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
