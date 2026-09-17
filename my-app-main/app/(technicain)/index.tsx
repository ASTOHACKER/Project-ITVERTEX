import RepairListScreen from '@/components/Shared_Repairs/RepairListScreen';
import type { RepairItem } from '@/components/Shared_Repairs/types';
import { useRouter } from 'expo-router';

export default function TechnicianRepairsScreen() {
  const router = useRouter();

  const handlePressDetails = (item: RepairItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
      },
    });
  };

  const handlePressQuote = (item: RepairItem) => {
    router.push({
      pathname: '/make-quote',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
      },
    });
  };

  return (
    <RepairListScreen
      subtitle="งานทั้งหมด (ช่าง)"
      showHeader={true}
      onPressDetails={handlePressDetails}
      onPressMakeQuote={handlePressQuote}
    />
  );
}
