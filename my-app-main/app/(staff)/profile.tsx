import SharedProfileScreen from '@/components/Shared_Profile/ProfileScreen';

export default function StaffProfileScreen() {
  return (
    <SharedProfileScreen
      roleConfig={{
        roleBadge: 'Staff',
        roleLabel: 'พนักงานรับเครื่อง / บริการ (Staff)',
        roleIcon: 'desktop-outline',
        badgeColorClass: 'text-amber-700 bg-amber-50',
        fallbackInitial: 'S',
        fallbackName: 'พนักงาน',
      }}
    />
  );
}
