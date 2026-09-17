import SharedProfileScreen from '@/components/Shared_Profile/ProfileScreen';

export default function CustomerProfileScreen() {
  return (
    <SharedProfileScreen
      roleConfig={{
        roleBadge: 'Customer',
        roleLabel: 'ลูกค้า (Customer)',
        roleIcon: 'person-outline',
        badgeColorClass: 'text-emerald-700 bg-emerald-50',
        fallbackInitial: 'C',
        fallbackName: 'ลูกค้า',
      }}
    />
  );
}
