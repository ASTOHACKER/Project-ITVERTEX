// 1. React & React Native
import { View, Text } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. Hooks & Types
import type { PasswordRuleKey, PasswordRules } from '@/hooks/use-password-strength';

interface RuleDef {
  key: PasswordRuleKey;
  label: string;
}

interface Props {
  rules: PasswordRules;
  ruleDefs: RuleDef[];
}

export default function PasswordStrengthIndicator({ rules, ruleDefs }: Props) {
  return (
    <View className="mt-3">
      <Text className="text-xs text-slate-400 mb-1.5">รหัสผ่านต้องประกอบด้วย:</Text>
      {ruleDefs.map((rule) => {
        const ok = rules[rule.key];
        return (
          <View key={rule.key} className="flex-row items-center mt-1">
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={ok ? '#16a34a' : '#cbd5e1'}
            />
            <Text className={`ml-1.5 text-xs ${ok ? 'text-green-600' : 'text-slate-400'}`}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
