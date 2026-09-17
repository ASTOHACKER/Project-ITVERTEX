import SharedProfileScreen from '@/components/Shared_Profile/ProfileScreen';

export default function ManagerProfileScreen() {
  return (
    <SharedProfileScreen
      roleConfig={{
        roleBadge: 'Manager',
        roleLabel: 'ผู้จัดการระบบ (Manager)',
        roleIcon: 'briefcase-outline',
        badgeColorClass: 'text-purple-700 bg-purple-50',
        fallbackInitial: 'M',
        fallbackName: 'ผู้จัดการ',
      }}
    />
  );
}
