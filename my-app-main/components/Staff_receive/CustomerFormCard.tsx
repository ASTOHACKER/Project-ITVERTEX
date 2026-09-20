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
import { lookupProfiles, lookupProfilesAdvanced, api } from '@/lib/api';

type AdvFilterId = 'name' | 'phone' | 'email';

// เลือกได้ว่าจะเปิดกรองละเอียดอันไหนบ้าง — ลบอันที่ไม่ต้องการออกจาก array นี้
const ENABLED_ADV_FILTERS: AdvFilterId[] = ['name', 'phone', 'email'];

const ADV_FILTER_META: Record<AdvFilterId, { label: string; placeholder: string; icon: string }> = {
  name: { label: 'ชื่อ', placeholder: 'ชื่อบางส่วน เช่น ใจ', icon: 'person-outline' },
  phone: { label: 'เบอร์โทร', placeholder: 'เบอร์บางตัว เช่น 0812', icon: 'call-outline' },
  email: { label: 'อีเมล', placeholder: 'อีเมลบางส่วน เช่น gmail', icon: 'mail-outline' },
};

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
  const [searchText, setSearchText] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'name' | 'phone' | 'email'>('all');
  const [showFilter, setShowFilter] = useState(false);
  // กรองละเอียดแบบเลือกเปิดเอง — ไม่โชว์ทั้งหมดพร้อมกัน
  const [advName, setAdvName] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advEmail, setAdvEmail] = useState('');
  const [visibleAdvFilters, setVisibleAdvFilters] = useState<AdvFilterId[]>([]);
  const debounceTimerRef = useRef<any>(null);

  // Quick Register Modal State
  const [quickRegVisible, setQuickRegVisible] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Single unified search (name / phone / email) with 300ms Debounce, min 1 char
  const searchProfiles = (query: string, filterOverride?: 'all' | 'name' | 'phone' | 'email') => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = (query || '').trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false);
      return;
    }

    const activeFilter = filterOverride ?? searchFilter;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await lookupProfiles(trimmed, activeFilter);

        if (response.success && response.data) {
          setSuggestions(response.data);
          setShowSuggestions(true);
          setHasSearched(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
          setHasSearched(true);
        }
      } catch (err) {
        console.error('Search profiles error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    searchProfiles(text);
  };

  const handleFilterChange = (filter: 'all' | 'name' | 'phone' | 'email') => {
    setSearchFilter(filter);
    if (searchText.trim().length >= 1) {
      searchProfiles(searchText, filter);
    }
  };

  const getAdvValue = (id: AdvFilterId) => (id === 'name' ? advName : id === 'phone' ? advPhone : advEmail);
  const setAdvValue = (id: AdvFilterId, v: string) => {
    if (id === 'name') setAdvName(v);
    else if (id === 'phone') setAdvPhone(v);
    else setAdvEmail(v);
  };
  const hasAdvancedFilter = advName.trim() || advPhone.trim() || advEmail.trim();
  const activeFilterCount =
    (searchFilter !== 'all' ? 1 : 0) + visibleAdvFilters.length;

  // Advanced search: เฉพาะกรองที่เปิดไว้ (AND กัน)
  const searchAdvanced = (nameVal: string, phoneVal: string, emailVal: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const n = (nameVal || '').trim();
    const p = (phoneVal || '').trim();
    const e = (emailVal || '').trim();
    if (!n && !p && !e) {
      if (searchText.trim().length >= 1) {
        searchProfiles(searchText);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setHasSearched(false);
      }
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await lookupProfilesAdvanced({ name: n, phone: p, email: e });
        if (response.success && response.data) {
          setSuggestions(response.data);
          setShowSuggestions(true);
          setHasSearched(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
          setHasSearched(true);
        }
      } catch (err) {
        console.error('Search profiles advanced error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const addAdvFilter = (id: AdvFilterId) => {
    if (!ENABLED_ADV_FILTERS.includes(id)) return;
    if (!visibleAdvFilters.includes(id)) {
      setVisibleAdvFilters((prev) => [...prev, id]);
    }
  };

  const removeAdvFilter = (id: AdvFilterId) => {
    setAdvValue(id, '');
    const nextVisible = visibleAdvFilters.filter((f) => f !== id);
    setVisibleAdvFilters(nextVisible);
    const nextVals = {
      name: id === 'name' ? '' : advName,
      phone: id === 'phone' ? '' : advPhone,
      email: id === 'email' ? '' : advEmail,
    };
    searchAdvanced(nextVals.name, nextVals.phone, nextVals.email);
  };

  const handleClearFilters = () => {
    setAdvName('');
    setAdvPhone('');
    setAdvEmail('');
    setVisibleAdvFilters([]);
    setSearchFilter('all');
    if (searchText.trim().length >= 1) {
      searchProfiles(searchText, 'all');
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false);
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchText('');
    if (advName.trim() || advPhone.trim() || advEmail.trim()) {
      searchAdvanced(advName, advPhone, advEmail);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false);
    }
  };

  const handleSelectSuggestion = (item: ProfileSuggestion) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    onChangeCustomerName(fullName);
    if (item.phone) onChangePhone(item.phone);
    if (item.email) onChangeEmail(item.email);
    onSelectCustomer?.(item);
    setShowSuggestions(false);
    setHasSearched(false);
    setSearchText('');
    setAdvName('');
    setAdvPhone('');
    setAdvEmail('');
    setVisibleAdvFilters([]);
  };

  const openQuickRegister = () => {
    const baseName = customerName.trim() || advName.trim() || searchText.trim();
    const parts = baseName.split(' ');
    const digitsInSearch = (searchText || advPhone).replace(/[^0-9]/g, '').slice(0, 10);
    setRegFirstName(parts[0] || '');
    setRegLastName(parts.slice(1).join(' ') || '');
    setRegPhone(phone.trim() || advPhone.trim() || digitsInSearch);
    setRegEmail(email.trim() || advEmail.trim());
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
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setSearchText('');
        setAdvName('');
        setAdvPhone('');
        setAdvEmail('');
        setVisibleAdvFilters([]);
        setSuggestions([]);
        setShowSuggestions(false);
        setHasSearched(false);
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
        {/* Unified Search + ปุ่มกรอง (เลือกเปิดเฉพาะอันที่ใช้) */}
        {!selectedCustomerId && (
          <View className="flex-col gap-2">
            <Text className="text-xs font-medium text-slate-600 font-body">ค้นหาลูกค้า</Text>
            <View className="flex-row gap-2">
              <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-3 min-h-[48px]">
                <Ionicons name="search" size={20} color="#64748B" />
                <TextInput
                  className="flex-1 ml-2 text-sm text-slate-800 py-2 font-body"
                  value={searchText}
                  onChangeText={handleSearchChange}
                  placeholder={
                    searchFilter === 'phone'
                      ? 'พิมพ์เบอร์ เช่น 081...'
                      : searchFilter === 'email'
                        ? 'พิมพ์อีเมล เช่น cus@...'
                        : searchFilter === 'name'
                          ? 'พิมพ์ชื่อ เช่น สมชาย...'
                          : 'พิมพ์ชื่อ / เบอร์ / อีเมล แค่ 1 ตัวก็ค้นได้...'
                  }
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType={searchFilter === 'phone' ? 'phone-pad' : 'default'}
                  returnKeyType="search"
                />
                {loading ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : searchText.length > 0 ? (
                  <TouchableOpacity
                    onPress={handleClearSearch}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="ล้างคำค้น"
                  >
                    <Ionicons name="close-circle" size={20} color="#64748B" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => setShowFilter((v) => !v)}
                activeOpacity={0.7}
                accessibilityLabel="กรองการค้นหา"
                className={`w-[48px] min-h-[48px] rounded-xl justify-center items-center relative border ${
                  activeFilterCount > 0 || showFilter
                    ? 'bg-blue-50 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Ionicons
                  name="filter"
                  size={22}
                  color={activeFilterCount > 0 || showFilter ? '#2563EB' : '#475569'}
                />
                {activeFilterCount > 0 && (
                  <View className="absolute -top-1.5 -right-1.5 bg-blue-600 rounded-full min-w-[20px] h-[20px] px-1 items-center justify-center border-2 border-white">
                    <Text className="text-white text-[11px] font-bold leading-none">{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {showFilter && (
              <View className="flex-col gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <Text className="text-[11px] font-bold text-slate-500 font-heading">ค้นด่วนตามประเภท</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(
                    [
                      { id: 'all', label: 'ทั้งหมด' },
                      { id: 'name', label: 'ชื่อ' },
                      { id: 'phone', label: 'เบอร์โทร' },
                      { id: 'email', label: 'อีเมล' },
                    ] as const
                  ).map((f) => {
                    const isActive = searchFilter === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => handleFilterChange(f.id)}
                        activeOpacity={0.7}
                        className={`px-3.5 py-1.5 rounded-full border ${
                          isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs ${isActive ? 'text-white font-bold font-heading' : 'text-slate-600 font-body'}`}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="h-px bg-slate-200 my-1" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-slate-500 font-heading">
                    กรองละเอียด — กดเลือกเฉพาะอันที่จะใช้ (ผสมกันได้)
                  </Text>
                  {(hasAdvancedFilter || visibleAdvFilters.length > 0) && (
                    <TouchableOpacity onPress={handleClearFilters} hitSlop={8}>
                      <Text className="text-[11px] font-bold text-blue-600 font-heading">ล้างตัวกรอง</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ตัวที่เปิดไว้ */}
                {visibleAdvFilters.map((id) => {
                  const meta = ADV_FILTER_META[id];
                  const value = getAdvValue(id);
                  return (
                    <View
                      key={id}
                      className="flex-row items-center bg-white border border-blue-200 rounded-xl px-3 min-h-[44px]"
                    >
                      <Ionicons name={meta.icon as any} size={16} color="#2563EB" />
                      <TextInput
                        className="flex-1 ml-2 text-sm text-slate-800 py-2 font-body"
                        value={value}
                        onChangeText={(t) => {
                          const v = id === 'phone' ? t.replace(/[^0-9]/g, '').slice(0, 10) : t;
                          setAdvValue(id, v);
                          searchAdvanced(
                            id === 'name' ? v : advName,
                            id === 'phone' ? v : advPhone,
                            id === 'email' ? v : advEmail
                          );
                        }}
                        placeholder={meta.placeholder}
                        placeholderTextColor="#94A3B8"
                        keyboardType={
                          id === 'phone' ? 'phone-pad' : id === 'email' ? 'email-address' : 'default'
                        }
                        autoCapitalize="none"
                        maxLength={id === 'phone' ? 10 : undefined}
                      />
                      <TouchableOpacity
                        onPress={() => removeAdvFilter(id)}
                        hitSlop={10}
                        accessibilityLabel={`เอาตัวกรอง${meta.label}ออก`}
                      >
                        <Ionicons name="close-circle" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* ตัวที่ยังไม่เปิด — กดเพื่อเพิ่ม */}
                {ENABLED_ADV_FILTERS.filter((id) => !visibleAdvFilters.includes(id)).length > 0 && (
                  <View className="flex-col gap-2">
                    <Text className="text-[11px] text-slate-500 font-body">
                      {visibleAdvFilters.length === 0
                        ? 'ยังไม่เปิดตัวกรองละเอียด — กดเพิ่มอันที่จะใช้ เช่น รู้ชื่อบางส่วน + รู้เบอร์บางตัว'
                        : 'เพิ่มตัวกรองอีก:'}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {ENABLED_ADV_FILTERS.filter((id) => !visibleAdvFilters.includes(id)).map((id) => (
                        <TouchableOpacity
                          key={id}
                          onPress={() => addAdvFilter(id)}
                          activeOpacity={0.7}
                          className="flex-row items-center px-3 py-1.5 rounded-full border border-dashed border-blue-400 bg-white"
                        >
                          <Ionicons name="add" size={14} color="#2563EB" />
                          <Text className="text-xs text-blue-600 font-bold font-heading ml-1">
                            {ADV_FILTER_META[id].label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {hasAdvancedFilter && (
                  <Text className="text-[11px] text-blue-600 font-body">
                    กำลังกรองแบบผสม{' '}
                    {[advName.trim() && 'ชื่อ', advPhone.trim() && 'เบอร์', advEmail.trim() && 'อีเมล']
                      .filter(Boolean)
                      .join(' + ')}{' '}
                    — ผลลัพธ์ต้องตรงทุกเงื่อนไข
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        {/* Suggestions — ติดใต้ช่องค้นหาทันที (ไม่ต้องเลื่อนลงไปล่างสุด) */}
        {!selectedCustomerId && showSuggestions && hasSearched && !loading && suggestions.length > 0 && (
          <View className="bg-slate-50 rounded-xl border border-sky-200 overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-1.5 bg-sky-100 px-3 py-1.5">
              <Ionicons name="people-outline" size={14} color="#0284C7" />
              <Text className="text-[11px] font-bold text-sky-800 font-heading">
                พบรายชื่อสมาชิกในระบบ ({suggestions.length}) แตะเพื่อเลือก:
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

        {/* Empty state — ติดใต้ช่องค้นหา */}
        {!selectedCustomerId &&
          showSuggestions &&
          hasSearched &&
          !loading &&
          suggestions.length === 0 &&
          (searchText.trim().length >= 1 || hasAdvancedFilter) && (
            <View className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <View className="flex-col items-center p-4 gap-2">
                <Ionicons name="person-add-outline" size={28} color="#94A3B8" />
                <Text className="text-xs text-slate-600 font-body text-center">
                  ไม่พบลูกค้า "{searchText.trim() || [advName.trim(), advPhone.trim(), advEmail.trim()].filter(Boolean).join(' • ')}"
                </Text>
                <TouchableOpacity
                  onPress={openQuickRegister}
                  activeOpacity={0.8}
                  className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full mt-1"
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white ml-1 font-heading">สร้างลูกค้าใหม่</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
                onPress={() => {
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  setSearchText('');
                  setAdvName('');
                  setAdvPhone('');
                  setAdvEmail('');
                  setVisibleAdvFilters([]);
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setHasSearched(false);
                  onClearCustomer();
                }}
                className="px-3 py-1 bg-white border border-emerald-300 rounded-lg"
              >
                <Text className="text-xs text-emerald-800 font-bold font-heading">เปลี่ยน</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Full Name Input (detail — search via top box) */}
        <View className="flex-col gap-1">
          <Text className="text-xs font-medium text-slate-600 font-body">ชื่อ-นามสกุลลูกค้า *</Text>
          <TextInput
            className="h-[44px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white font-body"
            value={customerName}
            onChangeText={onChangeCustomerName}
            placeholder="กรอกชื่อลูกค้า..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Phone Input (detail — search via top box) */}
        <View className="flex-col gap-1">
          <Text className="text-xs font-medium text-slate-600 font-body">เบอร์โทรศัพท์ติดต่อ *</Text>
          <TextInput
            className="h-[44px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white font-body"
            value={phone}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
              onChangePhone(digits);
            }}
            placeholder="เช่น 0812345678..."
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
