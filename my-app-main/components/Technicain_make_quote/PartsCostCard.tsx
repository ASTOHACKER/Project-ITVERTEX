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

interface PartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  item_id?: number;
}

interface PartsCostCardProps {
  parts: PartItem[];
  partInputName: string;
  setPartInputName: (text: string) => void;
  partInputPrice: string;
  setPartInputPrice: (text: string) => void;
  partInputQty: string;
  setPartInputQty: (text: string) => void;
  onAddPart: (itemFromDb?: any) => void;
  onRemovePart: (id: string) => void;
  onUpdatePartQty?: (id: string, newQty: number) => void;
  totalPartsCost: number;
}

export default function PartsCostCard({
  parts,
  partInputName,
  setPartInputName,
  partInputPrice,
  setPartInputPrice,
  partInputQty,
  setPartInputQty,
  onAddPart,
  onRemovePart,
  onUpdatePartQty,
  totalPartsCost,
}: PartsCostCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  // iPhone SE / compact iPhone / split-screen safe breakpoint
  const isCompactScreen = windowWidth < 420;
  const [dbParts, setDbParts] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDbParts();
  }, []);

  const fetchDbParts = async () => {
    try {
      setLoading(true);
      const res = await getItems(1);
      if (res.success && res.data) {
        setDbParts(res.data);
      }
    } catch (e) {
      console.error('Fetch db items error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPartFromDb = (item: any) => {
    onAddPart(item);
    setShowPicker(false);
  };

  return (
    <View className="bg-white rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-sm shadow-black/5 elevation-2">
      <View className="py-2.5 px-4 bg-[#E0F2FE]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-[15px] text-[#0369A1]">
              ค่าอะไหล่ (Parts Cost)
            </Text>
            <Text className="text-xs text-slate-600 mt-0.5">เลือกอะไหล่จากคลัง หรือระบุเอง</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-white px-2.5 py-1.5 rounded-2xl border border-[#0369A1]"
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="cube-outline" size={16} color="#0369A1" />
            <Text className="text-xs font-bold text-[#0369A1]">เลือกจากคลัง</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="p-3.5">
        {/* Clean 2-Row Form Input Layout */}
        <View className="gap-2.5 mb-3.5">
          <TextInput
            className="border border-slate-300 rounded-xl px-3.5 h-[46px] text-sm text-slate-800 bg-slate-50 w-full"
            placeholder="ชื่ออะไหล่"
            placeholderTextColor="#94A3B8"
            value={partInputName}
            onChangeText={setPartInputName}
          />
          {/* Row 2a: ราคา + Stepper จำนวน (inline) */}
          <View className="flex-row gap-2 items-center">
            <TextInput
              className="flex-[1.3] border border-slate-300 rounded-xl px-3 h-11 text-sm text-slate-800 bg-slate-50"
              placeholder="ราคา (บาท)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={partInputPrice}
              onChangeText={(text) => setPartInputPrice(text.replace(/[^0-9.]/g, ''))}
            />
            <View className="flex-row items-center border border-slate-300 rounded-xl bg-white h-11 overflow-hidden">
              <TouchableOpacity
                className="w-9 h-11 justify-center items-center bg-slate-100"
                onPress={() => {
                  const current = parseInt(partInputQty, 10) || 1;
                  setPartInputQty(String(Math.max(1, current - 1)));
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={16} color="#0369A1" />
              </TouchableOpacity>
              <View className="w-10 h-11 justify-center items-center bg-white">
                <TextInput
                  className="text-sm font-bold text-slate-800 w-full text-center p-0 m-0"
                  keyboardType="numeric"
                  value={partInputQty}
                  onChangeText={(text) => setPartInputQty(text.replace(/[^0-9]/g, ''))}
                  selectTextOnFocus
                />
              </View>
              <TouchableOpacity
                className="w-9 h-11 justify-center items-center bg-slate-100"
                onPress={() => {
                  const current = parseInt(partInputQty, 10) || 1;
                  setPartInputQty(String(current + 1));
                }}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={16} color="#0369A1" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Row 2b: ปุ่ม + เพิ่ม (เต็มความกว้างตอนจอแคบ, inline ตอนจอใหญ่) */}
          <TouchableOpacity
            className={`bg-sky-600 px-4 h-11 rounded-xl flex-row justify-center items-center min-w-[84px] shadow-sm active:bg-sky-700 ${isCompactScreen ? 'w-full min-w-0' : ''} ${!partInputName.trim() || !partInputPrice.trim() ? 'opacity-50' : ''}`}
            onPress={() => {
              if (!partInputName.trim() || !partInputPrice.trim()) return;
              onAddPart();
            }}
            disabled={!partInputName.trim() || !partInputPrice.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text className="text-white font-bold text-sm font-heading">เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        {/* List Box */}
        <View className="border border-slate-200 rounded-xl bg-slate-50 p-2 min-h-[70px] mb-3">
          {parts.length === 0 ? (
            <Text className="text-[13px] text-slate-400 text-center mt-5 mb-5">ไม่มีข้อมูลค่าอะไหล่</Text>
          ) : (
            parts.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-3 mb-2 border border-slate-200 shadow-sm shadow-black/5 elevation-1">
                {/* Top Row: Name + Delete */}
                <View className="flex-row justify-between items-start gap-2 mb-2">
                  <Text className="text-sm font-semibold text-slate-800 flex-1 leading-5" numberOfLines={2}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() => onRemovePart(item.id)}
                    className="p-1.5 -mr-1 -mt-1 min-w-[36px] min-h-[36px] justify-center items-center"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Unit Price + Mobile-Friendly Touch Stepper + Total */}
                <View className="flex-row justify-between items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">
                    {item.price.toLocaleString()} บ./ชิ้น
                  </Text>
                  <View className="flex-row items-center gap-2.5 ml-auto">
                    <View className="flex-row items-center bg-slate-100 rounded-lg border border-slate-300 overflow-hidden">
                      <TouchableOpacity
                        className="px-2.5 h-[34px] justify-center items-center bg-slate-200"
                        onPress={() => onUpdatePartQty?.(item.id, Math.max(1, item.qty - 1))}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="remove" size={16} color="#0369A1" />
                      </TouchableOpacity>
                      <TextInput
                        className="text-[13px] font-bold text-slate-900 min-w-[32px] text-center py-0 px-1 h-[34px]"
                        keyboardType="numeric"
                        value={String(item.qty)}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num > 0) {
                            onUpdatePartQty?.(item.id, num);
                          }
                        }}
                      />
                      <TouchableOpacity
                        className="px-2.5 h-[34px] justify-center items-center bg-slate-200"
                        onPress={() => onUpdatePartQty?.(item.id, item.qty + 1)}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="add" size={16} color="#0369A1" />
                      </TouchableOpacity>
                    </View>
                    <Text className="font-bold text-[15px] text-[#0369A1]">
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
          รวมค่าอะไหล่: <Text className="font-bold text-slate-800">{totalPartsCost.toLocaleString()} บาท</Text>
        </Text>
      </View>

      {/* Modal เลือกอะไหล่จากคลัง DB (Mobile Bottom Sheet / Card) */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[80%] shadow-lg shadow-black/15 elevation-10">
            <View className="flex-row justify-between items-start pb-3.5 border-b border-slate-100 mb-2">
              <View>
                <Text className="text-[17px] font-bold text-slate-800">เลือกอะไหล่จากคลัง</Text>
                <Text className="text-xs text-slate-500 mt-0.5">แตะเพื่อเลือกอะไหล่ลงในใบเสนอราคา</Text>
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
              {dbParts.length === 0 ? (
                <Text className="text-center my-7 text-slate-500">
                  {loading ? 'กำลังโหลดข้อมูลคลัง...' : 'ไม่พบข้อมูลอะไหล่ในคลัง'}
                </Text>
              ) : (
                dbParts.map((item) => (
                  <TouchableOpacity
                    key={item.item_id}
                    className="flex-row justify-between items-center py-3.5 px-2.5 border-b border-slate-50 min-h-[52px]"
                    onPress={() => handleSelectPartFromDb(item)}
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
                    <View className="bg-sky-50 px-2.5 py-1 rounded-lg">
                      <Text className="text-sm font-bold text-[#0369A1]">
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
