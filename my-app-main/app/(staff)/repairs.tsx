import RepairListScreen from '@/components/Shared_Repairs/RepairListScreen';
import type { RepairItem } from '@/components/Shared_Repairs/types';
import { useRouter } from 'expo-router';

export default function StaffRepairsScreen() {
  const router = useRouter();

  const handlePressHandover = (item: RepairItem) => {
    router.push({
      pathname: '/deliver-handover' as any,
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        device: item.device || 'อุปกรณ์',
        price: String(item.price || 300),
        role: 'staff',
      },
    });
  };

  const handlePressPaymentCheck = (item: RepairItem) => {
    router.push({
      pathname: '/verify-payment' as any,
      params: {
        jobId: item.id,
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        device: item.device || 'อุปกรณ์',
        amount: String(item.price || 300),
        role: 'staff',
      },
    });
  };

  const handleOpenFullDocument = (item: RepairItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
        role: 'staff',
        edit: 'true',
      },
    });
  };

  return (
    <RepairListScreen
      subtitle="รายการซ่อม (พนักงาน)"
      onPressDetails={handleOpenFullDocument}
      onPressHandover={handlePressHandover}
      onPressPaymentCheck={handlePressPaymentCheck}
      onOpenFullDocument={handleOpenFullDocument}
    />
  );
}
