// 1. React & React Native
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { lookupProfiles, api } from '@/lib/api';

export interface ProfileSuggestion {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
}

interface CustomerFormCardProps {
  customerName: string;
  onChangeCustomerName: (text: string) => void;
  phone: string;
  onChangePhone: (text: string) => void;
  email: string;
  onChangeEmail: (text: string) => void;
  selectedCustomerId?: string | null;
  onSelectCustomer?: (profile: ProfileSuggestion) => void;
  onClearCustomer?: () => void;
}

export default function CustomerFormCard({
  customerName,
  onChangeCustomerName,
  phone,
  onChangePhone,
  email,
  onChangeEmail,
  selectedCustomerId,
  onSelectCustomer,
  onClearCustomer,
}: CustomerFormCardProps) {
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState<'name' | 'phone' | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Quick Register Modal State
  const [quickRegVisible, setQuickRegVisible] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Search profiles from Backend API with 300ms Debounce
  const searchProfiles = (query: string, type: 'name' | 'phone') => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setActiveSearchType(type);

        const response = await lookupProfiles(query.trim(), type);

        if (response.success && response.data && response.data.length > 0) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Search profiles error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (item: ProfileSuggestion) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    onChangeCustomerName(fullName);
    if (item.phone) onChangePhone(item.phone);
    if (item.email) onChangeEmail(item.email);
    onSelectCustomer?.(item);
    setShowSuggestions(false);
  };

  const openQuickRegister = () => {
    const parts = customerName.trim().split(' ');
    setRegFirstName(parts[0] || '');
    setRegLastName(parts.slice(1).join(' ') || '');
    setRegPhone(phone.trim());
    setRegEmail(email.trim());
    setQuickRegVisible(true);
  };

  const handleConfirmQuickRegister = async () => {
    if (!regFirstName.trim() || !regPhone.trim()) {
      if (Platform.OS === 'web') {
        window.alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ของลูกค้า');
      } else {
        Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเบอร์โทรศัพท์ของลูกค้า');
      }
      return;
    }

    setIsRegistering(true);
    try {
      const cleanPhone = regPhone.replace(/[^0-9]/g, '').slice(0, 10);
      const cleanEmail = regEmail.trim() || `cus_${cleanPhone || Date.now()}@itvertex.local`;
      const res = await api.post('/auth/register', {
        first_name: regFirstName.trim(),
        last_name: regLastName.trim() || '-',
        phone: cleanPhone,
        email: cleanEmail,
        password: 'Customer1234Z',
      });

      if (res.success && res.data?.user) {
        const newUser = res.data.user;
        const fullName = `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim();
        onChangeCustomerName(fullName);
        onChangePhone(newUser.phone || cleanPhone);
        onChangeEmail(newUser.email || cleanEmail);

        onSelectCustomer?.({
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          email: newUser.email,
        });

        setQuickRegVisible(false);
        if (Platform.OS === 'web') {
          window.alert('ลงทะเบียนลูกค้าใหม่เรียบร้อยแล้ว');
        } else {
          Alert.alert('สำเร็จ', 'ลงทะเบียนลูกค้าใหม่เรียบร้อยแล้ว');
        }
      } else {
        throw new Error(res.message || 'ไม่สามารถลงทะเบียนได้');
      }
    } catch (err: any) {
      console.error('Quick register error:', err);
      const msg = err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียนลูกค้า';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', msg);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-4 border border-blue-50 shadow-sm shadow-black/5 elevation-2">
      {/* Header */}
      <View className="bg-blue-50 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="person-outline" size={16} color="#1E40AF" />
          <Text className="text-sm font-bold text-blue-900 font-heading">ข้อมูลลูกค้าผู้ส่งซ่อม</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {selectedCustomerId ? (
            <View className="flex-row items-center bg-emerald-100 px-2.5 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text className="text-[11px] font-bold text-emerald-800 ml-1 font-heading">เลือกลูกค้าแล้ว</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={openQuickRegister}
              activeOpacity={0.8}
              className="flex-row items-center bg-blue-600 px-2.5 py-1 rounded-full shadow-sm"
            >
              <Ionicons name="person-add-outline" size={12} color="#FFFFFF" />
              <Text className="text-[11px] font-bold text-white ml-1 font-heading">+ ลูกค้าใหม่</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="p-4 flex-col gap-3">
        {selectedCustomerId && (
          <View className="flex-row items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-1">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="person-circle" size={28} color="#059669" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-emerald-900 font-heading" numberOfLines={1}>
                  {customerName}
                </Text>
                <Text className="text-[11px] text-emerald-700 font-body">
                  โทร: {phone || '-'}  •  {email || 'ไม่มีอีเมล'}
                </Text>
              </View>
            </View>
            {onClearCustomer && (
              <TouchableOpacity
                onPress={onClearCustomer}
                className="px-3 py-1 bg-white border border-emerald-300 rounded-lg"
              >
                <Text className="text-xs text-emerald-800 font-bold font-heading">เปลี่ยน</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Full Name Input with Autocomplete */}
        <View className="flex-col gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600 font-body">ชื่อ-นามสกุลลูกค้า *</Text>
            {loading && activeSearchType === 'name' && (
              <ActivityIndicator size="small" color="#DC2626" />
            )}
          </View>
          <TextInput
            className="h-[44px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white font-body"
            value={customerName}
            onChangeText={(text) => {
              onChangeCustomerName(text);
              searchProfiles(text, 'name');
            }}
            placeholder="พิมพ์ชื่อเพื่อค้นหา หรือกรอกชื่อลูกค้า..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Phone Input with Autocomplete */}
        <View className="flex-col gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600 font-body">เบอร์โทรศัพท์ติดต่อ *</Text>
            {loading && activeSearchType === 'phone' && (
              <ActivityIndicator size="small" color="#DC2626" />
            )}
          </View>
          <TextInput
            className="h-[44px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white font-body"
            value={phone}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
              onChangePhone(digits);
              searchProfiles(digits, 'phone');
            }}
            placeholder="พิมพ์เบอร์โทรศัพท์ เช่น 0812345678..."
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Email */}
        <View className="flex-col gap-1">
          <Text className="text-xs font-medium text-slate-600 font-body">อีเมล (ถ้ามี)</Text>
          <TextInput
            className="h-[44px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white font-body"
            value={email}
            onChangeText={(text) => onChangeEmail(text.trim())}
            placeholder="example@email.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Suggestions Dropdown List */}
        {showSuggestions && suggestions.length > 0 && (
          <View className="mt-1 bg-slate-50 rounded-xl border border-sky-200 overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-1.5 bg-sky-100 px-3 py-1.5">
              <Ionicons name="people-outline" size={14} color="#0284C7" />
              <Text className="text-[11px] font-bold text-sky-800 font-heading">
                พบลายชื่อสมาชิกในระบบ (แตะเพื่อเลือก):
              </Text>
            </View>

            {suggestions.map((item) => {
              const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
              return (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center p-3 border-b border-slate-100 gap-2.5 bg-white"
                  activeOpacity={0.7}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center border border-red-100">
                    <Ionicons name="person" size={16} color="#DC2626" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-slate-800 font-heading">{fullName}</Text>
                    <Text className="text-[11px] text-slate-500 font-body mt-0.5">
                      📱 {item.phone || '-'}  •  ✉️ {item.email || '-'}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Register Modal */}
      <Modal visible={quickRegVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-lg border border-slate-200">
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <View className="flex-row items-center gap-2">
                <Ionicons name="person-add" size={20} color="#DC2626" />
                <Text className="text-base font-bold text-slate-900 font-heading">
                  ลงทะเบียนลูกค้าใหม่หน้าร้าน
                </Text>
              </View>
              <TouchableOpacity onPress={() => setQuickRegVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-3">
              <View>
                <Text className="text-xs text-slate-600 font-body mb-1">ชื่อจริง *</Text>
                <TextInput
                  className="h-10 border border-slate-200 rounded-xl px-3 text-sm font-body"
                  value={regFirstName}
                  onChangeText={setRegFirstName}
                  placeholder="เช่น สมชาย"
                />
              </View>

              <View>
                <Text className="text-xs text-slate-600 font-body mb-1">นามสกุล</Text>
                <TextInput
                  className="h-10 border border-slate-200 rounded-xl px-3 text-sm font-body"
                  value={regLastName}
                  onChangeText={setRegLastName}
                  placeholder="เช่น ใจดี"
                />
              </View>

              <View>
                <Text className="text-xs text-slate-600 font-body mb-1">เบอร์โทรศัพท์ *</Text>
                <TextInput
                  className="h-10 border border-slate-200 rounded-xl px-3 text-sm font-body"
                  value={regPhone}
                  onChangeText={(t) => setRegPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  placeholder="08xxxxxxxx"
                  maxLength={10}
                />
              </View>

              <View>
                <Text className="text-xs text-slate-600 font-body mb-1">อีเมล (ถ้ามี)</Text>
                <TextInput
                  className="h-10 border border-slate-200 rounded-xl px-3 text-sm font-body"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="customer@email.com"
                />
              </View>
            </View>

            <View className="flex-row items-center gap-2 mt-5">
              <TouchableOpacity
                onPress={() => setQuickRegVisible(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center"
              >
                <Text className="text-xs font-bold text-slate-600 font-heading">ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmQuickRegister}
                disabled={isRegistering}
                className="flex-1 py-2.5 rounded-xl bg-[#DC2626] items-center"
              >
                {isRegistering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-white font-heading">บันทึกลูกค้า</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
