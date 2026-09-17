import RepairListScreen from '@/components/Shared_Repairs/RepairListScreen';
import type { RepairItem } from '@/components/Shared_Repairs/types';
import { useRouter } from 'expo-router';

export default function ManagerRepairsScreen() {
  const router = useRouter();

  const handlePressDetails = (item: RepairItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
        role: 'manager',
      },
    });
  };

  return (
    <RepairListScreen
      subtitle="งานทั้งหมด"
      onPressDetails={handlePressDetails}
    />
  );
}
