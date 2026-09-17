import { useMemo } from 'react';

export type PasswordRuleKey = 'length' | 'lower' | 'upper' | 'number' | 'symbol';

export type PasswordRules = Record<PasswordRuleKey, boolean>;

export interface PasswordStrength {
    rules: PasswordRules;
    isStrong: boolean;
    /** จำนวนข้อที่ผ่าน (0-5) — เอาไว้ทำ strength bar ได้ */
    score: number;
    /** จำนวนข้อทั้งหมด */
    total: number;
}

const RULE_DEFS: { key: PasswordRuleKey; label: string; test: (s: string) => boolean }[] = [
    { key: 'length', label: 'ความยาวอย่างน้อย 8 ตัวอักษร', test: (s) => s.length >= 8 },
    { key: 'lower', label: 'ตัวอักษรพิมพ์เล็ก (a-z)', test: (s) => /[a-z]/.test(s) },
    { key: 'upper', label: 'ตัวอักษรพิมพ์ใหญ่ (A-Z)', test: (s) => /[A-Z]/.test(s) },
    { key: 'number', label: 'ตัวเลข (0-9)', test: (s) => /[0-9]/.test(s) },
    { key: 'symbol', label: 'สัญลักษณ์ เช่น !@#$%^&*', test: (s) => /[^A-Za-z0-9]/.test(s) },
];

/**
 * Hook ตรวจความแข็งแรงของรหัสผ่าน
 *
 * @example
 *   const { rules, isStrong, score, total, ruleDefs } = usePasswordStrength(password);
 *   const isSubmitDisabled = !email || !username || !isStrong;
 */
export function usePasswordStrength(password: string): PasswordStrength & { ruleDefs: typeof RULE_DEFS } {
    const rules = useMemo<PasswordRules>(() => {
        return RULE_DEFS.reduce((acc, def) => {
            acc[def.key] = def.test(password);
            return acc;
        }, {} as PasswordRules);
    }, [password]);

    const score = useMemo(() => Object.values(rules).filter(Boolean).length, [rules]);
    const isStrong = score === RULE_DEFS.length;

    return {
        rules,
        isStrong,
        score,
        total: RULE_DEFS.length,
        ruleDefs: RULE_DEFS,
    };
}
