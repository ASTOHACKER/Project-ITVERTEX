import SharedProfileScreen from '@/components/Shared_Profile/ProfileScreen';

export default function SharedProfile() {
  return (
    <SharedProfileScreen
      roleConfig={{
        roleBadge: 'User',
        roleLabel: 'ผู้ใช้งานระบบ',
        roleIcon: 'person-outline',
        badgeColorClass: 'text-slate-700 bg-slate-100',
        fallbackInitial: 'U',
        fallbackName: 'ผู้ใช้งาน',
        showBackButton: true,
        fallbackBackRoute: '/(customer)',
      }}
    />
  );
}
