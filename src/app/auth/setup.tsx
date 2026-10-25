import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function SetupScreen() {
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!department.trim()) { setError('Enter your department.'); return; }
      await api.updateProfile(fullName.trim(), department.trim());
      await refresh();
      router.replace('/');
    } catch (e: any) {
      setError(e.message ?? 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.sky }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: '100%', maxWidth: 380, gap: 14, backgroundColor: colors.white, borderRadius: 20, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Tell us about you</Text>
          <Input label="Full name" placeholder="e.g. Abebe Kebede" value={fullName} onChangeText={setFullName} autoFocus />
          <Input label="Department" placeholder="e.g. Computer Science" value={department} onChangeText={setDepartment} />
          {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
          <Button label="Finish" onPress={submit} loading={loading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
