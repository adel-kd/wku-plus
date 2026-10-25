import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme';

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}> = ({ title, subtitle, right, onBack }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Pressable onPress={onBack ?? (() => goBackOr('/'))} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Back</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 21, fontWeight: '800', color: colors.ink }}>{title}</Text>
          {subtitle ? <Text style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
};
