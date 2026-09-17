import SharedProfileScreen from '@/components/Shared_Profile/ProfileScreen';

export default function TechnicianProfileScreen() {
  return (
    <SharedProfileScreen
      roleConfig={{
        roleBadge: 'Technician',
        roleLabel: 'ช่างซ่อม / ตรวจเช็ค (Technician)',
        roleIcon: 'construct-outline',
        badgeColorClass: 'text-blue-600 bg-blue-50',
        fallbackInitial: 'T',
        fallbackName: 'ช่าง',
      }}
    />
  );
}
