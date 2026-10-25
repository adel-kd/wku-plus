import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { goBackOr } from '@/lib/navigation';
import { supabase } from '@/lib/supabaseClient';
import { colors } from '@/theme';

export default function DeliveryApply() {
  const { profile } = useAuth();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!profile || reason.trim().length < 10) return Alert.alert('Add a little more information', 'Tell the admin why you want to become a delivery runner.');
    setSaving(true);
    const { error } = await supabase.from('delivery_applications').insert({ user_id: profile.id, user_name: profile.fullName || profile.username, user_phone: profile.phone, reason: reason.trim() });
    setSaving(false);
    if (error) return Alert.alert('Could not apply', error.message.includes('one_pending') ? 'You already have an application waiting for review.' : error.message);
    Alert.alert('Application sent', 'Delivery applications are free. An admin will review yours shortly.');
    goBackOr('/delivery');
  }
  return <Screen><PageHeader title="Become a delivery runner" subtitle="Free for WKU students" />
    <View style={styles.body}>
      <View style={styles.notice}><Ionicons name="checkmark-circle-outline" size={24} color={colors.success} /><View style={{ flex: 1 }}><Text style={styles.noticeTitle}>No subscription fee</Text><Text style={styles.copy}>Apply once. The admin verifies your account before delivery orders become available.</Text></View></View>
      <Text style={styles.label}>Why do you want to deliver?</Text>
      <TextInput value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="Tell us about your availability and campus familiarity" placeholderTextColor={colors.muted} style={styles.input} />
      <Button label={saving ? 'Sending…' : 'Submit free application'} onPress={submit} loading={saving} />
    </View></Screen>;
}
const styles = StyleSheet.create({ body: { padding: 16, gap: 12 }, notice: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: 18, backgroundColor: '#EFFAF5', borderWidth: 1, borderColor: '#CDEDDD' }, noticeTitle: { color: colors.ink, fontWeight: '800' }, copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, label: { color: colors.ink, fontWeight: '700', marginTop: 8 }, input: { minHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, color: colors.ink, textAlignVertical: 'top' } });
