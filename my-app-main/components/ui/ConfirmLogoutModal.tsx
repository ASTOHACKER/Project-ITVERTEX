// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface ConfirmLogoutModalProps {
  visible: boolean;
  userName?: string;
  userRole?: string;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  success?: boolean;
}

export default function ConfirmLogoutModal({
  visible,
  userName,
  userRole,
  title = 'ยืนยันออกจากระบบ',
  message = 'คุณต้องการออกจากระบบ IT VERTEX ใช่หรือไม่? คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อเข้าใช้งาน',
  confirmText = 'ออกจากระบบ',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  loading = false,
  success = false,
}: ConfirmLogoutModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={success ? undefined : onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="w-full max-w-[340px] bg-white rounded-2xl p-6 items-center shadow-xl shadow-black/20 elevation-10">
          {success ? (
            /* ── Success Completed State ── */
            <>
              {/* Success Icon Container */}
              <View className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 justify-center items-center mb-3.5 shadow-sm">
                <Ionicons name="checkmark-circle" size={36} color="#16A34A" />
              </View>

              {/* Title */}
              <Text className="text-xl font-bold text-slate-800 text-center mb-1.5 font-heading">
                ออกจากระบบเสร็จสิ้น
              </Text>

              {/* User badge */}
              {(userName || userRole) && (
                <View className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-1.5 w-full mb-3 flex-row items-center justify-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-xs font-semibold text-emerald-900 font-heading" numberOfLines={1}>
                    {userName || 'ผู้ใช้งาน'}
                  </Text>
                  {userRole && (
                    <Text className="text-[11px] text-emerald-700 font-body">
                      ({userRole})
                    </Text>
                  )}
                </View>
              )}

              {/* Message */}
              <Text className="text-xs text-slate-500 text-center mb-5 leading-5 font-body">
                ระบบได้ล้างเซสชันการเข้าสู่ระบบเรียบร้อยแล้ว ขอบคุณที่ใช้งาน IT VERTEX
              </Text>

              {/* Redirecting Banner */}
              <View className="w-full bg-slate-50 border border-slate-200 h-12 rounded-xl flex-row items-center justify-center gap-2 px-3">
                <ActivityIndicator size="small" color="#DC2626" />
                <Text className="text-slate-700 text-xs font-bold font-heading">
                  กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...
                </Text>
              </View>
            </>
          ) : (
            /* ── Confirmation Prompt State ── */
            <>
              {/* Logout Icon Container */}
              <View className="w-14 h-14 rounded-full bg-red-50 border border-red-100 justify-center items-center mb-3.5">
                <Ionicons name="log-out-outline" size={28} color="#DC2626" />
              </View>

              {/* Title */}
              <Text className="text-lg font-bold text-slate-800 text-center mb-1.5 font-heading">
                {title}
              </Text>

              {/* User info chip if present */}
              {(userName || userRole) && (
                <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full mb-3 flex-row items-center justify-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-red-500" />
                  <Text className="text-xs font-semibold text-slate-700 font-heading" numberOfLines={1}>
                    {userName || 'ผู้ใช้งาน'}
                  </Text>
                  {userRole && (
                    <Text className="text-[11px] text-slate-500 font-body">
                      ({userRole})
                    </Text>
                  )}
                </View>
              )}

              {/* Message */}
              <Text className="text-xs text-slate-500 text-center mb-6 leading-5 font-body">
                {message}
              </Text>

              {/* Action Buttons */}
              <View className="flex-row gap-2.5 w-full">
                <TouchableOpacity
                  disabled={loading}
                  className="flex-1 bg-slate-100 border border-slate-200 h-12 rounded-xl justify-center items-center active:bg-slate-200"
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text className="text-slate-700 text-sm font-semibold font-heading">
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={loading}
                  className="flex-1 bg-[#DC2626] border border-red-700 h-12 rounded-xl justify-center items-center active:opacity-90 shadow-sm shadow-red-300"
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="log-out-outline" size={16} color="#ffffff" />
                      <Text className="text-white text-sm font-bold font-heading">
                        {confirmText}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
