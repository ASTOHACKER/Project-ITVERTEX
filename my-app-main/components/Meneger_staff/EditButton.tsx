// 1. React & React Native
import { TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface EditButtonProps {
  onPress?: () => void;
}

export default function EditButton({ onPress }: EditButtonProps) {
  return (
    <TouchableOpacity className="w-9 h-9 rounded-[18px] bg-[#EBF3FF] justify-center items-center" activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="pencil-sharp" size={16} color="#3B82F6" />
    </TouchableOpacity>
  );
}
