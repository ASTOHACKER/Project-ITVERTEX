// 1. React & React Native
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 3. API helpers
import { createDevice, createRepairJob, logRepairJobDetail, lookupProfiles, api } from '@/lib/api';

// 4. Components
import CustomerFormCard from '@/components/Staff_receive/CustomerFormCard';
import DeviceFormCard from '@/components/Staff_receive/DeviceFormCard';
import ReceiptPreviewModal from '@/components/Staff_receive/ReceiptPreviewModal';
import CustomAlert from '@/components/ui/CustomAlert';

export default function StaffReceiveScreen() {
  const insets = useSafeAreaInsets();

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Device & Repair Form State (ตรงตาม ER Diagram)
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedDeviceTypeName, setSelectedDeviceTypeName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [importantSoftware, setImportantSoftware] = useState('');
  const [passcode, setPasscode] = useState('');
  const [warrantyYear, setWarrantyYear] = useState<number>(1);
  const [warrantyEnd, setWarrantyEnd] = useState('');
  const [accessories, setAccessories] = useState('');
  const [symptomDetails, setSymptomDetails] = useState('');

  // Modals & Submit visibility
  const [isPreviewModalVisible, setPreviewModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedJobNo, setGeneratedJobNo] = useState('');

  // Alert Config
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const generateJobNumber = () => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `REP-${dateStr}-${randomNum}`;
  };

  const handleGeneratePdf = async () => {
    if (!customerName.trim() || !phone.trim()) {
      setAlertConfig({
        visible: true,
        title: 'ข้อมูลลูกค้าไม่ครบถ้วน',
        message: 'กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์ติดต่อ',
        type: 'warning',
      });
      return;
    }

    // Auto-resolve or register customer if not selected from suggestions
    let finalCustId = selectedCustomerId;
    if (!finalCustId && phone.trim()) {
      try {
        const cleanDigits = phone.replace(/[^0-9]/g, '').slice(0, 10);
        const lk = await lookupProfiles(cleanDigits, 'phone');
        if (lk.success && lk.data && lk.data.length > 0) {
          finalCustId = lk.data[0].id;
          setSelectedCustomerId(finalCustId);
        } else {
          // Auto-create customer profile on the fly so Staff is never blocked
          const parts = customerName.trim().split(' ');
          const fName = parts[0] || 'ลูกค้า';
          const lName = parts.slice(1).join(' ') || '-';
          const autoEmail = email.trim() || `cus_${cleanDigits || Date.now()}@itvertex.local`;
          const reg = await api.post('/auth/register', {
            first_name: fName,
            last_name: lName,
            phone: cleanDigits,
            email: autoEmail,
            password: 'Customer1234Z',
          });
          if (reg?.data?.user?.id) {
            finalCustId = reg.data.user.id;
            setSelectedCustomerId(finalCustId);
          }
        }
      } catch (e) {
        console.log('Auto resolve customer notice:', e);
      }
    }

    if (!selectedDeviceTypeId) {
      setAlertConfig({
        visible: true,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาเลือกประเภทอุปกรณ์ (Device Type)',
        type: 'warning',
      });
      return;
    }

    if (!selectedBrandId && !selectedBrandName.trim()) {
      setAlertConfig({
        visible: true,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาเลือกหรือระบุยี่ห้ออุปกรณ์ (Brand)',
        type: 'warning',
      });
      return;
    }

    if (!symptomDetails.trim()) {
      setAlertConfig({
        visible: true,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาระบุอาการเสียที่ลูกค้าแจ้ง',
        type: 'warning',
      });
      return;
    }

    const newJobNo = generateJobNumber();
    setGeneratedJobNo(newJobNo);
    setPreviewModalVisible(true);
  };

  const handleConfirmAndPrint = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setPreviewModalVisible(false);

      const jobNoToSave = generatedJobNo || generateJobNumber();

      // 1. สร้างอุปกรณ์ผ่าน POST /api/devices (ตรงตาม ER: device table)
      const devicePayload: any = {
        customer_id: selectedCustomerId || null,
        device_type_id: selectedDeviceTypeId,
        brand_id: selectedBrandId || null,
        brand_name: selectedBrandName.trim() || undefined,
        model: model.trim() || '-',
        included_accessories: accessories.trim() || '-',
        warranty_year: warrantyYear,
        warranty_end_date: warrantyEnd.trim() || null,
        serial_number: serialNumber.trim() || '-',
        important_software: importantSoftware.trim() || '-',
        device_password: passcode.trim() || '-',
      };

      const devRes = await createDevice(devicePayload);
      if (!devRes.success || !devRes.data?.device_id) {
        throw new Error(devRes.message || 'ไม่สามารถบันทึกข้อมูลอุปกรณ์ลงตาราง device ได้ กรุณาตรวจสอบข้อมูล');
      }
      const createdDeviceId = devRes.data.device_id;

      // 2. สร้างงานซ่อมผ่าน POST /api/repairs (ตรงตาม ER: repair_job table)
      const repairPayload: any = {
        device_id: createdDeviceId,
        symptom_id: null,
        symptom_details: symptomDetails.trim() || 'รับซ่อมเครื่อง',
        appointment_date: new Date().toISOString().slice(0, 10),
        status_id: 1, // 1 = รอตรวจเช็ค
      };

      const jobRes = await createRepairJob(repairPayload);

      let finalJobNo = jobNoToSave;
      if (jobRes.success && jobRes.data) {
        const createdJobId = jobRes.data.job_id;
        finalJobNo = `REP-${String(createdJobId).padStart(6, '0')}`;
        // Log action: รับเครื่อง (action_type_id = 1) ใน repair_job_detail
        await logRepairJobDetail(createdJobId, 1);
      }

      setAlertConfig({
        visible: true,
        title: 'สร้างใบรับซ่อมสำเร็จ',
        message: `สร้างใบรับซ่อมเลขที่ ${finalJobNo} ลงในระบบเรียบร้อยแล้ว พร้อมส่งต่อให้ช่างตรวจเช็ค`,
        type: 'success',
        confirmText: 'ตกลง',
      });

      // Clear form
      setCustomerName('');
      setPhone('');
      setEmail('');
      setSelectedCustomerId(null);
      setSelectedDeviceTypeId(null);
      setSelectedDeviceTypeName('');
      setSelectedBrandId(null);
      setSelectedBrandName('');
      setModel('');
      setSerialNumber('');
      setImportantSoftware('');
      setPasscode('');
      setAccessories('');
      setSymptomDetails('');
      setWarrantyYear(1);
      setWarrantyEnd('');
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถสร้างใบรับซ่อมได้',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewDeviceStr = `${selectedBrandName || ''} ${model || ''}`.trim() || selectedDeviceTypeName || 'อุปกรณ์';
  const previewSymptomStr = symptomDetails.trim() || 'ไม่ระบุอาการ';

  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Bar */}
      <View 
        className="bg-[#D32F2F] px-5 pb-4" 
        style={{ paddingTop: insets.top + 10 }}
      >
        <Text className="text-white text-xl font-bold font-heading">รับเครื่องซ่อมใหม่</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Customer Form Card */}
        <CustomerFormCard
          customerName={customerName}
          onChangeCustomerName={(text) => {
            setCustomerName(text);
            setSelectedCustomerId(null);
          }}
          phone={phone}
          onChangePhone={(text) => {
            setPhone(text);
            setSelectedCustomerId(null);
          }}
          email={email}
          onChangeEmail={setEmail}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={(profile) => {
            setSelectedCustomerId(profile.id);
          }}
          onClearCustomer={() => {
            setSelectedCustomerId(null);
            setCustomerName('');
            setPhone('');
            setEmail('');
          }}
        />

        {/* Device & Symptom Form Card */}
        <DeviceFormCard
          deviceTypeId={selectedDeviceTypeId}
          onChangeDeviceTypeId={(id, name) => {
            setSelectedDeviceTypeId(id);
            setSelectedDeviceTypeName(name);
          }}
          brandId={selectedBrandId}
          brandName={selectedBrandName}
          onChangeBrandId={(id, name) => {
            setSelectedBrandId(id);
            setSelectedBrandName(name);
          }}
          model={model}
          onChangeModel={setModel}
          serialNumber={serialNumber}
          onChangeSerialNumber={setSerialNumber}
          importantSoftware={importantSoftware}
          onChangeImportantSoftware={setImportantSoftware}
          passcode={passcode}
          onChangePasscode={setPasscode}
          warrantyYear={warrantyYear}
          onChangeWarrantyYear={setWarrantyYear}
          warrantyEnd={warrantyEnd}
          onChangeWarrantyEnd={setWarrantyEnd}
          accessories={accessories}
          onChangeAccessories={setAccessories}
          symptomDetails={symptomDetails}
          onChangeSymptomDetails={setSymptomDetails}
        />

        {/* Submit & Generate PDF Button */}
        <TouchableOpacity
          className={`bg-[#D32F2F] h-12 rounded-full flex-row items-center justify-center gap-2 mt-2 shadow-md shadow-red-500/30 elevation-4 ${
            isSubmitting ? 'opacity-60' : ''
          }`}
          activeOpacity={0.8}
          onPress={handleGeneratePdf}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-bold font-heading">บันทึกและสร้างใบรับซ่อม (PDF)</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        visible={isPreviewModalVisible}
        jobNo={generatedJobNo || 'REP-XXXXXX'}
        customerName={customerName || 'ไม่ระบุชื่อ'}
        device={previewDeviceStr}
        symptom={previewSymptomStr}
        dateStr={new Date().toLocaleDateString('th-TH')}
        onEdit={() => setPreviewModalVisible(false)}
        onConfirmAndPrint={handleConfirmAndPrint}
      />

      {/* Success Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
