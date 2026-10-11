import RepairListScreen from '@/components/Shared_Repairs/RepairListScreen';
import type { RepairItem } from '@/components/Shared_Repairs/types';
import { useRouter } from 'expo-router';

export default function StaffDeliverScreen() {
  const router = useRouter();

  const handlePressHandover = (item: RepairItem) => {
    router.push({
      pathname: '/deliver-handover' as any,
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        device: item.device || 'อุปกรณ์',
        price: String(item.price || item.total_amount || 300),
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
        amount: String(item.price || item.total_amount || 300),
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
      subtitle="ส่งมอบและตรวจชำระ"
      filterStatusIds={[6, 7, 8]}
      onPressDetails={handleOpenFullDocument}
      onPressHandover={handlePressHandover}
      onPressPaymentCheck={handlePressPaymentCheck}
      onOpenFullDocument={handleOpenFullDocument}
    />
  );
}
