import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow } from '@/theme';

export const Screen: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>
);

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View
    style={[
      { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
      shadow,
      style,
    ]}
  >
    {children}
  </View>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => (
  <Text style={[{ fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 10 }, style]}>{children}</Text>
);

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  small?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  small,
}) => {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
      ? colors.danger
      : variant === 'ghost'
      ? 'transparent'
      : colors.white;
  const fg = variant === 'ghost' ? colors.primary : variant === 'secondary' ? colors.deep : colors.white;
  const border = variant === 'secondary' ? colors.border : variant === 'ghost' ? 'transparent' : bg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          borderRadius: radius.pill,
          paddingVertical: small ? 9 : 13,
          paddingHorizontal: small ? 16 : 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{label}</Text>
    </Pressable>
  );
};

export const Input: React.FC<TextInputProps & { label?: string }> = ({ label, style, ...props }) => (
  <View style={{ gap: 6 }}>
    {label ? <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={colors.muted}
      style={[
        {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.ink,
        },
        style,
      ]}
      {...props}
    />
  </View>
);

export const Chip: React.FC<{
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, active, onPress, color, icon }) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: active ? (color ?? colors.primary) : colors.white,
      borderWidth: 1,
      borderColor: active ? (color ?? colors.primary) : colors.border,
    }}
  >
    {icon}
    <Text style={{ color: active ? colors.white : colors.ink, fontWeight: '600', fontSize: 13 }}>{label}</Text>
  </Pressable>
);

export const Badge: React.FC<{ label: string; tone?: 'success' | 'warn' | 'danger' | 'info' }> = ({
  label,
  tone = 'info',
}) => {
  const map = {
    success: colors.success,
    warn: colors.warn,
    danger: colors.danger,
    info: colors.primary,
  };
  const c = map[tone];
  return (
    <View style={{ backgroundColor: `${c}1A`, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: c, fontWeight: '700', fontSize: 11 }}>{label}</Text>
    </View>
  );
};

export const EmptyState: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
}) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 }}>
    {icon}
    <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 15 }}>{title}</Text>
    {subtitle ? <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>{subtitle}</Text> : null}
  </View>
);

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { justifyContent: 'space-between' },
  wrap: { flexWrap: 'wrap' },
});
