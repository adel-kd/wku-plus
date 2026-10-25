import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme';

export default function OtpScreen() {
  const { phone, flow } = useLocalSearchParams<{ phone: string; flow?: 'signup' | 'login' }>();
  const { refresh } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.verifyOtp(phone, code.trim());
      if (flow === 'signup') {
        const { readPendingSignup, clearPendingSignup } = await import('@/lib/pendingSignup');
        const pending = await readPendingSignup();
        if (!pending || pending.phone !== phone) throw new Error('Sign-up details expired. Please start again.');
        await api.updateProfile(pending.fullName, pending.department);
        await api.changePassword(pending.password);
        await clearPendingSignup();
      }
      await refresh();
      router.replace('/');
    } catch (e: any) {
      setError(e.message ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.sky }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
        <View style={{ width: '100%', maxWidth: 380, gap: 14, backgroundColor: colors.white, borderRadius: 20, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Enter the code</Text>
          <Text style={{ color: colors.muted }}>We sent a 6-digit code to {phone}</Text>
          <Input
            label="Verification code"
            placeholder="123456"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            autoFocus
          />
          {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
          <Button label="Verify & continue" onPress={submit} loading={loading} disabled={code.length < 4} />
          <Pressable onPress={() => goBackOr('/auth/phone')}>
            <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Change number</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
