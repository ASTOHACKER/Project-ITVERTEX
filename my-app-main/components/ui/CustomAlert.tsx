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
        return <Ionicons name="checkmark-circle" size={48} color="#2CBA42" />;
      case 'warning':
        return <Ionicons name="warning" size={48} color="#CAB036" />;
      case 'danger':
        return <Ionicons name="alert-circle" size={48} color="#E61C3C" />;
      default:
        return <Ionicons name="information-circle" size={48} color="#0097A7" />;
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
          <View className="mb-4">{getIcon()}</View>

          {/* Texts */}
          <Text className="text-lg font-bold text-slate-800 text-center mb-2">{title}</Text>
          <Text className="text-sm text-slate-500 text-center mb-6 leading-5">{message}</Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3 w-full">
            {onCancel && cancelText && (
              <TouchableOpacity className="flex-1 bg-slate-100 border border-slate-200 h-10 rounded-lg justify-center items-center" onPress={onCancel}>
                <Text className="text-slate-800 text-sm font-bold">{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={`flex-1 h-10 rounded-lg justify-center items-center ${type === 'danger' ? 'bg-[#E61C3C]' : 'bg-[#0097A7]'}`}
              onPress={onConfirm}
            >
              <Text className="text-white text-sm font-bold">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
