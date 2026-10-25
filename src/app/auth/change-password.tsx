import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme';

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(password);
      goBackOr('/(tabs)/profile');
    } catch (e: any) {
      setError(e.message ?? 'Could not change password.');
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
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Change password</Text>
          <Input label="New password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Confirm new password" placeholder="Enter it again" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
          <Button label="Update password" onPress={submit} loading={loading} />
          <Button label="Cancel" onPress={() => goBackOr('/(tabs)/profile')} variant="ghost" disabled={loading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
