import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function MerchantApply() {
  const { profile } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState('');
  const [reference, setReference] = useState('');

  async function submit() {
    if (!businessName.trim()) return Alert.alert('Enter a business name');
    if (!provider.trim() || !reference.trim()) return Alert.alert('Add your payment provider and payment reference');
    setSaving(true);
    try {
      const result = await api.verifyMerchantPayment(provider.trim(), reference.trim());
      await api.applyMerchant(businessName.trim(), `${reason.trim()}\nPayment: ${provider.trim()} / ${reference.trim()}\nVerification: ${result.status}`);
      Alert.alert(result.status === 'VALID' ? 'Payment verified' : 'Application sent', result.status === 'VALID' ? 'Your application is ready for admin approval.' : 'Payment needs manual admin verification.');
      goBackOr('/gebeya');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Apply for Merchant" subtitle="Sell new products on campus" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, backgroundColor: '#F8FCFE' }}><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 18 }}>500 Br / month</Text><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>Includes daily products and stories, a verified badge, and placement in the Verified Merchants section.</Text></View>
        <Input label="Business / Shop name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Abebe Stationary" />
        <Input label="Why do you want to sell?" value={reason} onChangeText={setReason} multiline placeholder="Tell us about your products…" />
        <Input label="Payment provider" value={provider} onChangeText={setProvider} placeholder="CBE, Telebirr, Dashen…" />
        <Input label="Payment reference" value={reference} onChangeText={setReference} placeholder="Receipt reference or link" />
        <Button label={saving ? 'Sending…' : 'Submit Application'} onPress={submit} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
