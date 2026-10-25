import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { savePendingSignup } from '@/lib/pendingSignup';
import { colors, radius } from '@/theme';

type Mode = 'login' | 'signup' | 'otp';

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  if (value.trim().startsWith('+')) return `+${digits}`;
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  return `+251${digits}`;
}

export default function AuthScreen() {
  const { refresh, isSampleMode } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const submit = async () => {
    setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+2519\d{8}$/.test(normalized)) {
      setError('Enter a valid Ethiopian mobile number, for example 0911 234 567.');
      return;
    }
    if (mode !== 'otp' && password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (mode === 'signup' && (!fullName.trim() || !department.trim())) {
      setError('Enter your full name and department.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await api.login(normalized, password);
        await refresh();
        router.replace('/');
        return;
      }

      if (mode === 'signup') {
        await savePendingSignup({ phone: normalized, fullName: fullName.trim(), department: department.trim(), password });
        await api.sendOtp(normalized, true);
        router.push({ pathname: '/auth/otp', params: { phone: normalized, flow: 'signup' } });
        return;
      }

      await api.sendOtp(normalized, false);
      router.push({ pathname: '/auth/otp', params: { phone: normalized, flow: 'login' } });
    } catch (e: any) {
      setError(e.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#EFF8FC' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', gap: 20 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Image source={require('../../../assets/logo.png')} style={{ width: 126, height: 84 }} contentFit="contain" />
            <Text style={{ fontSize: 25, fontWeight: '900', color: colors.ink }}>Welcome to WKU+</Text>
            <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 20 }}>Your Wolkite University campus, in one place.</Text>
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: '#DDEEF6', borderRadius: radius.pill, padding: 4 }}>
            {(['login', 'signup'] as const).map((item) => (
              <Pressable key={item} onPress={() => switchMode(item)} style={{ flex: 1, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: mode === item ? '#FFFFFF' : 'transparent', alignItems: 'center' }}>
                <Text style={{ color: mode === item ? colors.primary : colors.muted, fontWeight: '800' }}>{item === 'login' ? 'Log in' : 'Sign up'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#D7EAF3' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F7FD', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={mode === 'signup' ? 'person-add-outline' : 'lock-open-outline'} size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{mode === 'signup' ? 'Create your account' : mode === 'otp' ? 'Log in with OTP' : 'Welcome back'}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{mode === 'signup' ? 'Verify your campus account once' : 'Access your saved account'}</Text>
              </View>
            </View>

            {mode === 'signup' && <Input label="Full name" placeholder="Abebe Kebede" value={fullName} onChangeText={setFullName} autoCapitalize="words" />}
            <Input label="Phone number" placeholder="09xx xxx xxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            {mode === 'signup' && <Input label="Department" placeholder="Computer Science" value={department} onChangeText={setDepartment} autoCapitalize="words" />}
            {mode !== 'otp' && <Input label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />}
            {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
            <Button label={mode === 'login' ? 'Log in' : mode === 'signup' ? 'Send verification code' : 'Send login code'} onPress={submit} loading={loading} />

            {mode === 'login' && <Pressable onPress={() => switchMode('otp')}><Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '700' }}>Forgot password? Log in with OTP</Text></Pressable>}
            {mode === 'otp' && <Pressable onPress={() => switchMode('login')}><Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '700' }}>Use password instead</Text></Pressable>}
            {isSampleMode && <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center' }}>Sample code: 123456</Text>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
