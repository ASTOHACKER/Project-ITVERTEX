import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SlipPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  slipUrl: string | null;
  slipFilename?: string | null;
}

export default function SlipPreviewModal({
  visible,
  onClose,
  slipUrl,
  slipFilename,
}: SlipPreviewModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View className="flex-1 bg-black/85 items-center justify-center p-4">
        <TouchableOpacity
          className="absolute top-10 right-5 z-10 p-2.5 bg-white/20 rounded-full"
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        {slipUrl && (
          <Image
            source={{ uri: slipUrl }}
            style={{ width: '90%', height: '75%' }}
            resizeMode="contain"
          />
        )}
        {slipFilename && (
          <Text className="text-white text-xs font-body mt-3 text-center">
            {slipFilename}
          </Text>
        )}
      </View>
    </Modal>
  );
}
