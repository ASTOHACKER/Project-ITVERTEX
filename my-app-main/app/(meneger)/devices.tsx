// 1. React & React Native
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// 3. API helpers & Types
import {
  createCatalogBrand,
  createCatalogDeviceType,
  createCatalogModel,
  deleteCatalogBrand,
  deleteCatalogDeviceType,
  deleteCatalogModel,
  getCatalogBrands,
  getCatalogDeviceTypes,
  getCatalogModels,
  updateCatalogBrand,
  updateCatalogDeviceType,
  updateCatalogModel,
} from '@/lib/api';
import type { CatalogBrand, CatalogDeviceType, CatalogModel } from '@/types/device';

// 4. Shared UI Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import CustomAlert from '@/components/ui/CustomAlert';

// 5. Manager Device Components
import DeviceCatalogTable from '@/components/Meneger_devices/Table';
import DeviceTypeModal from '@/components/Meneger_devices/DeviceTypeModal';
import BrandModal from '@/components/Meneger_devices/BrandModal';
import ModelModal from '@/components/Meneger_devices/ModelModal';
import DeviceCatalogFilterSheet from '@/components/Meneger_devices/DeviceCatalogFilterSheet';

type ActiveTab = 'types' | 'brands' | 'models';

export default function DeviceCatalogScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('types');
  const [searchText, setSearchText] = useState('');

  // Data states
  const [deviceTypes, setDeviceTypes] = useState<CatalogDeviceType[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub-filter states
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<number | null>(null);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<number | null>(null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Active filter count for search bar
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTypeFilter !== null) count++;
    if (selectedBrandFilter !== null) count++;
    return count;
  }, [selectedTypeFilter, selectedBrandFilter]);

  // Modals visibility & loading
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Items to edit / delete
  const [editingType, setEditingType] = useState<CatalogDeviceType | null>(null);
  const [editingBrand, setEditingBrand] = useState<CatalogBrand | null>(null);
  const [editingModel, setEditingModel] = useState<CatalogModel | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; type: ActiveTab } | null>(null);

  // Processing indicators
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'danger' | 'info' = 'info'
  ) => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dtRes, bRes, mRes] = await Promise.all([
        getCatalogDeviceTypes().catch(() => ({ data: [] })),
        getCatalogBrands().catch(() => ({ data: [] })),
        getCatalogModels().catch(() => ({ data: [] })),
      ]);

      if (dtRes?.data) setDeviceTypes(dtRes.data);
      if (bRes?.data) setBrands(bRes.data);
      if (mRes?.data) setModels(mRes.data);
    } catch (err: any) {
      console.error('Fetch catalog error:', err);
      showAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // รักษาค่า selectedTypeFilter และ selectedBrandFilter ไว้ เพื่อให้ผู้ใช้สลับดู ประเภท/ยี่ห้อ/รุ่น ของตัวกรองเดิมได้ต่อเนื่อง
  };

  const handleSelectQuickType = (typeId: number | null) => {
    setSelectedTypeFilter(typeId);
    // เมื่อเปลี่ยนประเภทอุปกรณ์ ให้ตรวจสอบว่ายี่ห้อที่เลือกไว้เดิมรองรับประเภทใหม่นี้หรือไม่ หากไม่รองรับให้ล้างยี่ห้อออก
    if (typeId !== null && selectedBrandFilter !== null) {
      const bId = Number(selectedBrandFilter);
      const tId = Number(typeId);
      const brandObj = brands.find((b) => Number(b.brand_id) === bId);
      const isCompatible = brandObj?.device_types?.some(
        (dt) => Number(dt.device_type_id) === tId
      );
      if (!isCompatible) {
        setSelectedBrandFilter(null);
      }
    }
  };

  // ============================================================
  // Filtered Data Lists
  // ============================================================
  const filteredDeviceTypes = useMemo(() => {
    let list = [...deviceTypes];
    if (selectedTypeFilter !== null && selectedTypeFilter !== undefined) {
      const tId = Number(selectedTypeFilter);
      list = list.filter((dt) => Number(dt.device_type_id) === tId);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      list = list.filter((dt) => dt.device_type_name.toLowerCase().includes(q));
    }
    return list;
  }, [deviceTypes, selectedTypeFilter, searchText]);

  const filteredBrands = useMemo(() => {
    let list = [...brands];
    if (selectedTypeFilter !== null && selectedTypeFilter !== undefined) {
      const tId = Number(selectedTypeFilter);
      list = list.filter((b) =>
        b.device_types?.some((dt) => Number(dt.device_type_id) === tId)
      );
    }
    if (selectedBrandFilter !== null && selectedBrandFilter !== undefined) {
      const bId = Number(selectedBrandFilter);
      list = list.filter((b) => Number(b.brand_id) === bId);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      list = list.filter((b) => b.brand_name.toLowerCase().includes(q));
    }
    return list;
  }, [brands, selectedTypeFilter, selectedBrandFilter, searchText]);

  const filteredModels = useMemo(() => {
    let list = [...models];
    if (selectedTypeFilter !== null && selectedTypeFilter !== undefined) {
      const tId = Number(selectedTypeFilter);
      list = list.filter((m) => Number(m.device_type_id) === tId);
    }
    if (selectedBrandFilter !== null && selectedBrandFilter !== undefined) {
      const bId = Number(selectedBrandFilter);
      list = list.filter((m) => Number(m.brand_id) === bId);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.model_name.toLowerCase().includes(q) ||
          m.brand_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [models, selectedTypeFilter, selectedBrandFilter, searchText]);

  // ============================================================
  // Open Create / Edit Modals
  // ============================================================
  const handleOpenCreate = () => {
    if (activeTab === 'types') {
      setEditingType(null);
      setTypeModalVisible(true);
    } else if (activeTab === 'brands') {
      setEditingBrand(null);
      setBrandModalVisible(true);
    } else {
      setEditingModel(null);
      setModelModalVisible(true);
    }
  };

  const handleOpenEdit = (item: any) => {
    if (activeTab === 'types') {
      setEditingType(item);
      setTypeModalVisible(true);
    } else if (activeTab === 'brands') {
      setEditingBrand(item);
      setBrandModalVisible(true);
    } else {
      setEditingModel(item);
      setModelModalVisible(true);
    }
  };

  // ============================================================
  // Save Handlers
  // ============================================================
  const handleSaveType = async (typeName: string) => {
    setIsSaving(true);
    try {
      if (editingType) {
        await updateCatalogDeviceType(editingType.device_type_id, { device_type_name: typeName });
        showAlert('สำเร็จ', 'แก้ไขประเภทอุปกรณ์เรียบร้อยแล้ว', 'success');
      } else {
        await createCatalogDeviceType({ device_type_name: typeName });
        showAlert('สำเร็จ', 'เพิ่มประเภทอุปกรณ์ใหม่เรียบร้อยแล้ว', 'success');
      }
      setTypeModalVisible(false);
      setEditingType(null);
      await fetchData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกได้', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBrand = async (brandName: string, deviceTypeIds: number[]) => {
    setIsSaving(true);
    try {
      if (editingBrand) {
        await updateCatalogBrand(editingBrand.brand_id, {
          brand_name: brandName,
          device_type_ids: deviceTypeIds,
        });
        showAlert('สำเร็จ', 'แก้ไขยี่ห้อเรียบร้อยแล้ว', 'success');
      } else {
        await createCatalogBrand({
          brand_name: brandName,
          device_type_ids: deviceTypeIds,
        });
        showAlert('สำเร็จ', 'เพิ่มยี่ห้อใหม่เรียบร้อยแล้ว', 'success');
      }
      setBrandModalVisible(false);
      setEditingBrand(null);
      await fetchData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกได้', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModel = async (modelName: string, brandId: number, deviceTypeId: number) => {
    setIsSaving(true);
    try {
      if (editingModel) {
        await updateCatalogModel(editingModel.model_id, {
          model_name: modelName,
          brand_id: brandId,
          device_type_id: deviceTypeId,
        });
        showAlert('สำเร็จ', 'แก้ไขรุ่นอุปกรณ์เรียบร้อยแล้ว', 'success');
      } else {
        await createCatalogModel({
          model_name: modelName,
          brand_id: brandId,
          device_type_id: deviceTypeId,
        });
        showAlert('สำเร็จ', 'เพิ่มรุ่นอุปกรณ์ใหม่เรียบร้อยแล้ว', 'success');
      }
      setModelModalVisible(false);
      setEditingModel(null);
      await fetchData();
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกได้', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // Delete Handlers
  // ============================================================
  const handlePromptDelete = (item: any) => {
    if (activeTab === 'types') {
      setItemToDelete({ id: item.device_type_id, name: item.device_type_name, type: 'types' });
    } else if (activeTab === 'brands') {
      setItemToDelete({ id: item.brand_id, name: item.brand_name, type: 'brands' });
    } else {
      setItemToDelete({ id: item.model_id, name: item.model_name, type: 'models' });
    }
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'types') {
        await deleteCatalogDeviceType(itemToDelete.id);
      } else if (itemToDelete.type === 'brands') {
        await deleteCatalogBrand(itemToDelete.id);
      } else {
        await deleteCatalogModel(itemToDelete.id);
      }
      setDeleteModalVisible(false);
      setItemToDelete(null);
      showAlert('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว', 'success');
      await fetchData();
    } catch (err: any) {
      showAlert('ไม่สามารถลบได้', err.message || 'เกิดข้อผิดพลาดในการลบ', 'danger');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Top Header — Shared standard Header */}
      <Header title="IT VERTEX" subtitle="จัดการข้อมูลอุปกรณ์" />

      <View className="flex-1 p-4">
        {/* Search & Filter Bar */}
        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          showFilter={true}
          activeFilterCount={activeFilterCount}
          onPressFilter={() => setFilterSheetVisible(true)}
          placeholder={
            activeTab === 'types'
              ? 'ค้นหาประเภทอุปกรณ์...'
              : activeTab === 'brands'
                ? 'ค้นหายี่ห้อ (แบรนด์)...'
                : 'ค้นหารุ่น หรือแบรนด์...'
          }
        />

        {/* Active Filter Strip (Clean layout without overlapping) */}
        {activeFilterCount > 0 && (
          <View className="flex-row items-center flex-wrap mb-3 bg-white p-2.5 rounded-xl border border-slate-200">
            <View className="flex-row items-center mr-2 mb-1">
              <Ionicons name="funnel" size={13} color="#DC2626" />
              <Text className="text-[11px] font-bold text-slate-700 font-heading ml-1">
                ตัวกรอง:
              </Text>
            </View>

            {selectedTypeFilter !== null && (
              <View className="flex-row items-center bg-red-50 rounded-lg px-2.5 py-1 border border-red-200 mr-2 mb-1">
                <Text className="text-[11px] text-red-700 font-bold font-heading mr-1.5">
                  ประเภท: {deviceTypes.find((dt) => Number(dt.device_type_id) === Number(selectedTypeFilter))?.device_type_name || ''}
                </Text>
                <TouchableOpacity
                  onPress={() => handleSelectQuickType(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}

            {selectedBrandFilter !== null && (
              <View className="flex-row items-center bg-blue-50 rounded-lg px-2.5 py-1 border border-blue-200 mr-2 mb-1">
                <Text className="text-[11px] text-blue-700 font-bold font-heading mr-1.5">
                  ยี่ห้อ: {brands.find((b) => Number(b.brand_id) === Number(selectedBrandFilter))?.brand_name || ''}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedBrandFilter(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={14} color="#2563EB" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setSelectedTypeFilter(null);
                setSelectedBrandFilter(null);
              }}
              className="ml-auto mb-1 pl-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-[11px] text-red-600 font-bold font-heading underline">
                ล้างทั้งหมด
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Switcher: ประเภท vs ยี่ห้อ vs รุ่น (Style matching item.tsx) */}
        <View className="flex-row bg-slate-200 rounded-xl p-1 mb-3">
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${activeTab === 'types' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
              }`}
            onPress={() => handleTabChange('types')}
            activeOpacity={0.8}
          >
            <Text
              className={`font-body text-xs ${activeTab === 'types' ? 'font-bold text-[#DC2626] font-heading' : 'text-slate-600'
                }`}
            >
              ประเภท ({filteredDeviceTypes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${activeTab === 'brands' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
              }`}
            onPress={() => handleTabChange('brands')}
            activeOpacity={0.8}
          >
            <Text
              className={`font-body text-xs ${activeTab === 'brands' ? 'font-bold text-[#DC2626] font-heading' : 'text-slate-600'
                }`}
            >
              ยี่ห้อ ({filteredBrands.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-2.5 items-center justify-center rounded-lg ${activeTab === 'models' ? 'bg-white shadow-sm shadow-black/10 elevation-2' : ''
              }`}
            onPress={() => handleTabChange('models')}
            activeOpacity={0.8}
          >
            <Text
              className={`font-body text-xs ${activeTab === 'models' ? 'font-bold text-[#DC2626] font-heading' : 'text-slate-600'
                }`}
            >
              รุ่น ({filteredModels.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Content */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D62828" />
            <Text className="mt-3 font-body text-sm text-text-light">
              กำลังโหลดข้อมูลแคตตาล็อกอุปกรณ์...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'types' && (
              <DeviceCatalogTable
                key={`types-${selectedTypeFilter ?? 'all'}-${searchText}`}
                type="types"
                title="รายการประเภทอุปกรณ์ในระบบ"
                data={filteredDeviceTypes}
                headerColor="#0F172A"
                onPressEdit={handleOpenEdit}
                onPressDelete={handlePromptDelete}
              />
            )}

            {activeTab === 'brands' && (
              <DeviceCatalogTable
                key={`brands-${selectedTypeFilter ?? 'all'}-${selectedBrandFilter ?? 'all'}-${searchText}`}
                type="brands"
                title="รายการยี่ห้อ (แบรนด์) ในระบบ"
                data={filteredBrands}
                headerColor="#0F172A"
                onPressEdit={handleOpenEdit}
                onPressDelete={handlePromptDelete}
              />
            )}

            {activeTab === 'models' && (
              <DeviceCatalogTable
                key={`models-${selectedTypeFilter ?? 'all'}-${selectedBrandFilter ?? 'all'}-${searchText}`}
                type="models"
                title="รายการรุ่นอุปกรณ์ในระบบ"
                data={filteredModels}
                headerColor="#0F172A"
                onPressEdit={handleOpenEdit}
                onPressDelete={handlePromptDelete}
              />
            )}
          </ScrollView>
        )}
      </View>

      {/* Floating Action Button (FAB) matching item.tsx */}
      <FloatingActionButton
        onPress={handleOpenCreate}
        label={
          activeTab === 'types'
            ? 'เพิ่มประเภทอุปกรณ์ใหม่'
            : activeTab === 'brands'
              ? 'เพิ่มยี่ห้อใหม่'
              : 'เพิ่มรุ่นอุปกรณ์ใหม่'
        }
      />

      {/* Modals for Create / Edit */}
      <DeviceTypeModal
        visible={typeModalVisible}
        item={editingType}
        isSaving={isSaving}
        onClose={() => {
          setTypeModalVisible(false);
          setEditingType(null);
        }}
        onSave={handleSaveType}
      />

      <BrandModal
        visible={brandModalVisible}
        item={editingBrand}
        deviceTypes={deviceTypes}
        initialDeviceTypeId={selectedTypeFilter}
        isSaving={isSaving}
        onClose={() => {
          setBrandModalVisible(false);
          setEditingBrand(null);
        }}
        onSave={handleSaveBrand}
      />

      <ModelModal
        visible={modelModalVisible}
        item={editingModel}
        deviceTypes={deviceTypes}
        brands={brands}
        initialDeviceTypeId={selectedTypeFilter}
        initialBrandId={selectedBrandFilter}
        isSaving={isSaving}
        onClose={() => {
          setModelModalVisible(false);
          setEditingModel(null);
        }}
        onSave={handleSaveModel}
      />

      {/* Device Catalog Filter Sheet (Bottom Sheet matching ItemFilterSheet) */}
      <DeviceCatalogFilterSheet
        visible={filterSheetVisible}
        activeTab={activeTab}
        deviceTypes={deviceTypes}
        brands={brands}
        selectedTypeId={selectedTypeFilter}
        selectedBrandId={selectedBrandFilter}
        onApply={(typeId, brandId) => {
          setSelectedTypeFilter(typeId);
          setSelectedBrandFilter(brandId);
        }}
        onClose={() => setFilterSheetVisible(false)}
        onReset={() => {
          setSelectedTypeFilter(null);
          setSelectedBrandFilter(null);
        }}
      />

      {/* Delete Confirmation Modal (matching staff.tsx and item.tsx) */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title={
          itemToDelete?.type === 'types'
            ? 'ยืนยันการลบประเภทอุปกรณ์'
            : itemToDelete?.type === 'brands'
              ? 'ยืนยันการลบยี่ห้อ'
              : 'ยืนยันการลบรุ่นอุปกรณ์'
        }
        itemName={itemToDelete?.name}
        message="ระบบจะตรวจสอบว่ารายการนี้มีการใช้งานในประวัติงานซ่อมหรือไม่ หากมีจะไม่สามารถลบได้ คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?"
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalVisible(false);
            setItemToDelete(null);
          }
        }}
      />

      {/* CustomAlert Notifications */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
