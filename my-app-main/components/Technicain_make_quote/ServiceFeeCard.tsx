// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { getItems } from '@/lib/api';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  item_id?: number;
}

interface ServiceFeeCardProps {
  services: ServiceItem[];
  serviceInputName: string;
  setServiceInputName: (text: string) => void;
  serviceInputPrice: string;
  setServiceInputPrice: (text: string) => void;
  serviceInputQty: string;
  setServiceInputQty: (text: string) => void;
  onAddService: (itemFromDb?: any) => void;
  onRemoveService: (id: string) => void;
  onUpdateServiceQty?: (id: string, newQty: number) => void;
  totalServicesCost: number;
}

export default function ServiceFeeCard({
  services,
  serviceInputName,
  setServiceInputName,
  serviceInputPrice,
  setServiceInputPrice,
  serviceInputQty,
  setServiceInputQty,
  onAddService,
  onRemoveService,
  onUpdateServiceQty,
  totalServicesCost,
}: ServiceFeeCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactScreen = windowWidth < 420;
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDbServices();
  }, []);

  const fetchDbServices = async () => {
    try {
      setLoading(true);
      const res = await getItems(2);
      if (res.success && res.data) {
        setDbServices(res.data);
      }
    } catch (e) {
      console.error('Fetch db items error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServiceFromDb = (item: any) => {
    onAddService(item);
    setShowPicker(false);
  };

  return (
    <View className="bg-white rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-sm shadow-black/5 elevation-2">
      <View className="py-2.5 px-4 bg-[#FFFAF0]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-[15px] text-[#C2410C]">
              ค่าบริการ/ค่าแรง (Service Fee)
            </Text>
            <Text className="text-xs text-slate-600 mt-0.5">เลือกหรือกรอกค่าแรงสำหรับงานนี้</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-white px-2.5 py-1.5 rounded-2xl border border-[#C2410C]"
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="build-outline" size={16} color="#C2410C" />
            <Text className="text-xs font-bold text-[#C2410C]">เลือกจากคลัง</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="p-3.5">
        {/* Clean 2-Row Form Input Layout */}
        <View className="gap-2.5 mb-3.5">
          <TextInput
            className="border border-slate-300 rounded-xl px-3.5 h-[46px] text-sm text-slate-800 bg-slate-50 w-full"
            placeholder="ชื่อบริการ"
            placeholderTextColor="#94A3B8"
            value={serviceInputName}
            onChangeText={setServiceInputName}
          />
          {/* Row 2a: ราคา + Stepper จำนวน (inline) */}
          <View className="flex-row gap-2 items-center">
            <TextInput
              className="flex-[1.3] border border-slate-300 rounded-xl px-3 h-11 text-sm text-slate-800 bg-slate-50"
              placeholder="ราคา (บาท)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={serviceInputPrice}
              onChangeText={(text) => setServiceInputPrice(text.replace(/[^0-9.]/g, ''))}
            />
            <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 overflow-hidden">
              <TouchableOpacity
                className="w-9 h-11 justify-center items-center bg-slate-100"
                onPress={() => {
                  const current = parseInt(serviceInputQty, 10) || 1;
                  setServiceInputQty(String(Math.max(1, current - 1)));
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={16} color="#C2410C" />
              </TouchableOpacity>
              <View className="w-10 h-11 justify-center items-center bg-white">
                <TextInput
                  className="text-sm font-bold text-slate-800 w-full text-center p-0 m-0"
                  keyboardType="numeric"
                  value={serviceInputQty}
                  onChangeText={(text) => setServiceInputQty(text.replace(/[^0-9]/g, ''))}
                  selectTextOnFocus
                />
              </View>
              <TouchableOpacity
                className="w-9 h-11 justify-center items-center bg-slate-100"
                onPress={() => {
                  const current = parseInt(serviceInputQty, 10) || 1;
                  setServiceInputQty(String(current + 1));
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={16} color="#C2410C" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Row 2b: ปุ่ม + เพิ่ม (เต็มความกว้างตอนจอแคบ, inline ตอนจอใหญ่) */}
          <TouchableOpacity
            className={`bg-amber-600 px-4 h-11 rounded-xl flex-row justify-center items-center min-w-[84px] shadow-sm active:bg-amber-700 ${isCompactScreen ? 'w-full min-w-0' : ''} ${!serviceInputName.trim() || !serviceInputPrice.trim() ? 'opacity-50' : ''}`}
            onPress={() => {
              if (!serviceInputName.trim() || !serviceInputPrice.trim()) return;
              onAddService();
            }}
            disabled={!serviceInputName.trim() || !serviceInputPrice.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text className="text-white font-bold text-sm font-heading">เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        {/* List Box */}
        <View className="border border-slate-200 rounded-xl bg-slate-50 p-2 min-h-[70px] mb-3">
          {services.length === 0 ? (
            <Text className="text-[13px] text-slate-400 text-center mt-5 mb-5">ไม่มีข้อมูลค่าบริการ</Text>
          ) : (
            services.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-3 mb-2 border border-slate-200 shadow-sm shadow-black/5 elevation-1">
                {/* Top Row: Name + Delete */}
                <View className="flex-row justify-between items-start gap-2 mb-2">
                  <Text className="text-sm font-semibold text-slate-800 flex-1 leading-5" numberOfLines={2}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() => onRemoveService(item.id)}
                    className="p-1.5 -mr-1 -mt-1 min-w-[36px] min-h-[36px] justify-center items-center"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Unit Price + Mobile Touch Stepper + Total */}
                <View className="flex-row justify-between items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">
                    {item.price.toLocaleString()} บ./รายการ
                  </Text>
                  <View className="flex-row items-center gap-2.5 ml-auto">
                    <View className="flex-row items-center bg-slate-100 rounded-lg border border-slate-300 overflow-hidden">
                      <TouchableOpacity
                        className="px-2.5 h-[34px] justify-center items-center bg-slate-200"
                        onPress={() => onUpdateServiceQty?.(item.id, Math.max(1, item.qty - 1))}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="remove" size={16} color="#C2410C" />
                      </TouchableOpacity>
                      <TextInput
                        className="text-[13px] font-bold text-slate-900 min-w-[32px] text-center py-0 px-1 h-[34px]"
                        keyboardType="numeric"
                        value={String(item.qty)}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num > 0) {
                            onUpdateServiceQty?.(item.id, num);
                          }
                        }}
                      />
                      <TouchableOpacity
                        className="px-2.5 h-[34px] justify-center items-center bg-slate-200"
                        onPress={() => onUpdateServiceQty?.(item.id, item.qty + 1)}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="add" size={16} color="#C2410C" />
                      </TouchableOpacity>
                    </View>
                    <Text className="font-bold text-[15px] text-[#C2410C]">
                      {(item.price * item.qty).toLocaleString()}
                      <Text className="text-xs font-normal text-slate-500"> บาท</Text>
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        <Text className="text-[13px] text-slate-500 text-right">
          รวมค่าบริการ: <Text className="font-bold text-slate-800">{totalServicesCost.toLocaleString()} บาท</Text>
        </Text>
      </View>

      {/* Modal เลือกบริการจากคลัง DB (Mobile Bottom Sheet / Card) */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[80%] shadow-lg shadow-black/15 elevation-10">
            <View className="flex-row justify-between items-start pb-3.5 border-b border-slate-100 mb-2">
              <View>
                <Text className="text-[17px] font-bold text-slate-800">เลือกค่าบริการจากคลัง</Text>
                <Text className="text-xs text-slate-500 mt-0.5">แตะเพื่อเลือกรายการบริการลงในใบเสนอราคา</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                className="p-1 min-w-[36px] min-h-[36px] items-center justify-center"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {dbServices.length === 0 ? (
                <Text className="text-center my-7 text-slate-500">
                  {loading ? 'กำลังโหลดข้อมูลคลัง...' : 'ไม่พบข้อมูลบริการในคลัง'}
                </Text>
              ) : (
                dbServices.map((item) => (
                  <TouchableOpacity
                    key={item.item_id}
                    className="flex-row justify-between items-center py-3.5 px-2.5 border-b border-slate-50 min-h-[52px]"
                    onPress={() => handleSelectServiceFromDb(item)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-medium text-slate-800">{item.item_name}</Text>
                      {item.item_code && (
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          รหัส: {item.item_code}
                        </Text>
                      )}
                    </View>
                    <View className="bg-orange-50 px-2.5 py-1 rounded-lg">
                      <Text className="text-sm font-bold text-[#C2410C]">
                        {(item.selling_price || item.unit_price || 0).toLocaleString()} <Text className="text-[11px] font-normal">บ.</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
