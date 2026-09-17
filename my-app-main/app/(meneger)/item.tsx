// 1. React & React Native
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// 3. API helpers
import { deleteItem, getItems } from '@/lib/api';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import AddPartModal from '@/components/Meneger_item/AddPartModal';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import PartDetailsModal from '@/components/Meneger_item/PartDetailsModal';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import PartTable from '@/components/Meneger_item/Table';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import ItemFilterSheet, {
  DEFAULT_FILTER_STATE,
  FilterState,
  PARTS_CATEGORIES,
  SERVICES_CATEGORIES,
  getItemSubcategory,
} from '@/components/Meneger_item/ItemFilterSheet';

export default function PartsScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'services'>('parts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter Sheet state
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  const activeCategoryList = activeTab === 'parts' ? PARTS_CATEGORIES : SERVICES_CATEGORIES;

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeId = activeTab === 'parts' ? 1 : 2;
      const res = await getItems(typeId);
      if (!res.success) throw new Error(res.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      
      let data = res.data || [];
      // กรองแยกประเภท อะไหล่ (1) และ ค่าบริการ (2) อย่างแม่นยำ
      data = data.filter((item: any) => Number(item.item_type_id) === typeId);
      setDevices(data);
    } catch (err: any) {
      console.error('Error fetching devices:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchDevices();
    }, [fetchDevices])
  );

  const handleTabChange = (tab: 'parts' | 'services') => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      // Reset categories since parts and services have different categories
      setFilters((p) => ({ ...p, categories: [] }));
    }
  };

  // Filtered & Sorted items
  const filteredDevices = useMemo(() => {
    let list = [...devices];

    // 1. Search text filter
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      list = list.filter((item: any) => 
        (item.item_name || '').toLowerCase().includes(s) ||
        (item.item_code || '').toLowerCase().includes(s)
      );
    }

    // 2. Categories filter
    if (filters.categories.length > 0) {
      list = list.filter((item: any) => {
        const subCat = getItemSubcategory(item.item_name, activeTab);
        return filters.categories.includes(subCat);
      });
    }

    // 3. Usage filter
    if (filters.usage !== 'all') {
      if (filters.usage === 'used') {
        list = list.filter((item: any) => Number(item.used_count) > 0);
      } else if (filters.usage === 'frequent') {
        list = list.filter((item: any) => Number(item.used_count) >= 2);
      } else if (filters.usage === 'unused') {
        list = list.filter((item: any) => !item.used_count || Number(item.used_count) === 0);
      }
    }

    // 4. Price range filter
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) {
        list = list.filter((item: any) => Number(item.selling_price || 0) >= min);
      }
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) {
        list = list.filter((item: any) => Number(item.selling_price || 0) <= max);
      }
    }

    // 5. Sorting
    list.sort((a: any, b: any) => {
      if (filters.sortBy === 'name_asc') {
        return (a.item_name || '').localeCompare(b.item_name || '', 'th');
      }
      if (filters.sortBy === 'price_asc') {
        return Number(a.selling_price || 0) - Number(b.selling_price || 0);
      }
      if (filters.sortBy === 'price_desc') {
        return Number(b.selling_price || 0) - Number(a.selling_price || 0);
      }
      if (filters.sortBy === 'popular') {
        return Number(b.used_count || 0) - Number(a.used_count || 0);
      }
      // 'newest' default
      return Number(b.item_id || 0) - Number(a.item_id || 0);
    });

    return list;
  }, [devices, searchText, filters, activeTab]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.categories.length > 0) c += filters.categories.length;
    if (filters.usage !== 'all') c += 1;
    if (filters.minPrice || filters.maxPrice) c += 1;
    if (filters.sortBy !== 'newest') c += 1;
    return c;
  }, [filters]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setModalVisible(true);
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEditModal = (item: any) => {
    setDetailsVisible(false);
    setItemToEdit(item);
    setModalVisible(true);
  };

  const handleDeleteItem = (item: any) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteItem(itemToDelete.item_id);
      if (!res.success) throw new Error(res.message || 'ล้มเหลวในการลบ');

      showAlert('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว');
      setDetailsVisible(false);
      setSelectedItem(null);
      setDeleteModalVisible(false);
      setItemToDelete(null);
      fetchDevices();
    } catch (err: any) {
      console.error('Delete error:', err);
      showAlert('ล้มเหลว', err.message || 'ไม่สามารถลบรายการได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <Header subtitle="จัดการอะไหล่และค่าแรง" />

      <View className="flex-1 p-4">
        {/* Search & Filter Bar */}
        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          showFilter={true}
          activeFilterCount={activeFilterCount}
          onPressFilter={() => setFilterSheetVisible(true)}
          placeholder={`ค้นหา${activeTab === 'parts' ? 'อะไหล่' : 'ค่าบริการ'}...`}
        />

        {/* Active Filter Chips Strip (Shows when filters are active) */}
        {activeFilterCount > 0 && (
          <View className="flex-row items-center flex-wrap gap-1.5 mb-3 bg-white p-2.5 rounded-xl border border-slate-200">
            <View className="flex-row items-center gap-1 mr-1">
              <Ionicons name="funnel" size={13} color="#DC2626" />
              <Text className="text-[11px] font-bold text-slate-700 font-heading">ตัวกรอง:</Text>
            </View>

            {filters.sortBy !== 'newest' && (
              <View className="flex-row items-center bg-slate-100 rounded-lg px-2 py-0.5 border border-slate-200 gap-1">
                <Text className="text-[11px] text-slate-700 font-body">
                  เรียง: {filters.sortBy === 'name_asc' ? 'ชื่อ (ก-ฮ)' : filters.sortBy === 'price_asc' ? 'ราคาต่ำสุด' : filters.sortBy === 'price_desc' ? 'ราคาสูงสุด' : 'ใช้บ่อย'}
                </Text>
                <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, sortBy: 'newest' }))}>
                  <Ionicons name="close" size={12} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            {filters.categories.map((catId) => {
              const catObj = activeCategoryList.find((c) => c.id === catId);
              return (
                <View key={catId} className="flex-row items-center bg-red-50 rounded-lg px-2 py-0.5 border border-red-200 gap-1">
                  <Text className="text-[11px] text-red-700 font-bold font-heading">
                    {catObj?.label || catId}
                  </Text>
                  <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, categories: p.categories.filter((c) => c !== catId) }))}>
                    <Ionicons name="close" size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {filters.usage !== 'all' && (
              <View className="flex-row items-center bg-blue-50 rounded-lg px-2 py-0.5 border border-blue-200 gap-1">
                <Text className="text-[11px] text-blue-700 font-bold font-heading">
                  {filters.usage === 'used' ? 'เคยใช้งาน' : filters.usage === 'frequent' ? 'ใช้บ่อย' : 'ยังไม่เคยใช้'}
                </Text>
                <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, usage: 'all' }))}>
                  <Ionicons name="close" size={12} color="#2563EB" />
                </TouchableOpacity>
              </View>
            )}

            {(filters.minPrice || filters.maxPrice) && (
              <View className="flex-row items-center bg-amber-50 rounded-lg px-2 py-0.5 border border-amber-200 gap-1">
                <Text className="text-[11px] text-amber-800 font-bold font-heading">
                  ฿{filters.minPrice || '0'} – {filters.maxPrice ? `฿${filters.maxPrice}` : 'ไม่จำกัด'}
                </Text>
                <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, minPrice: '', maxPrice: '', pricePreset: 'all' }))}>
                  <Ionicons name="close" size={12} color="#D97706" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setFilters(DEFAULT_FILTER_STATE)}
              className="ml-auto"
            >
              <Text className="text-[11px] text-red-600 font-bold font-heading underline">
                ล้างหมด
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Switcher: อะไหล่ vs ค่าบริการ */}
        <View className="flex-row bg-slate-200 rounded-xl p-1 mb-3">
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${
              activeTab === 'parts' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
            }`}
            onPress={() => handleTabChange('parts')}
            activeOpacity={0.8}
          >
            <Text className={`font-body text-sm ${
              activeTab === 'parts' ? 'font-bold text-[#D32F2F] font-heading' : 'text-slate-600'
            }`}>
              อะไหล่ ({activeTab === 'parts' ? filteredDevices.length : devices.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${
              activeTab === 'services' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
            }`}
            onPress={() => handleTabChange('services')}
            activeOpacity={0.8}
          >
            <Text className={`font-body text-sm ${
              activeTab === 'services' ? 'font-bold text-[#D32F2F] font-heading' : 'text-slate-600'
            }`}>
              ค่าบริการ ({activeTab === 'services' ? filteredDevices.length : devices.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Content */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text className="mt-3 font-body text-sm text-slate-500">กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
            <PartTable
              title={activeTab === 'parts' ? "รายการอะไหล่ในคลัง" : "รายการอัตราค่าบริการ"}
              data={filteredDevices}
              headerColor={activeTab === 'parts' ? "#0F172A" : "#1E293B"}
              onPressDetails={(item) => {
                setSelectedItem(item);
                setDetailsVisible(true);
              }}
            />
          </ScrollView>
        )}
      </View>

      <FloatingActionButton onPress={handleOpenAddModal} />

      {/* Filter Bottom Sheet */}
      <ItemFilterSheet
        visible={filterSheetVisible}
        activeTab={activeTab}
        filters={filters}
        matchingCount={filteredDevices.length}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setFilterSheetVisible(false);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTER_STATE);
          setFilterSheetVisible(false);
        }}
      />

      <AddPartModal
        visible={isModalVisible}
        itemToEdit={itemToEdit}
        onClose={() => {
          setModalVisible(false);
          setItemToEdit(null);
        }}
        onSuccess={fetchDevices}
      />

      <PartDetailsModal
        visible={isDetailsVisible}
        item={selectedItem}
        onClose={() => {
          setDetailsVisible(false);
          setSelectedItem(null);
        }}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteItem}
      />

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="ยืนยันการลบรายการ"
        itemName={itemToDelete?.item_name}
        message="คุณต้องการลบรายการนี้ออกจากระบบอย่างถาวรหรือไม่?"
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />
    </View>
  );
}
