import { Text, View } from 'react-native';

interface ContactInfoCardProps {
  phone: string;
  email: string;
}

export default function ContactInfoCard({ phone, email }: ContactInfoCardProps) {
  return (
    <View className="bg-white rounded-2xl px-5 py-[18px] mx-5 -mt-4 shadow-sm border border-pill-inactive">
      <Text className="text-sm font-heading text-text-light font-bold mb-3">ข้อมูลติดต่อ</Text>

      {/* Phone */}
      <View className="py-1.5">
        <Text className="text-[11px] font-body text-[#A0A0A0] mb-0.5">เบอร์โทรศัพท์</Text>
        <Text className="text-base font-body text-text-dark">{phone}</Text>
      </View>

      <View className="h-px bg-pill-inactive my-3" />

      {/* Email */}
      <View className="py-1.5">
        <Text className="text-[11px] font-body text-[#A0A0A0] mb-0.5">อีเมล</Text>
        <Text className="text-base font-body text-text-dark">{email}</Text>
      </View>
    </View>
  );
}
