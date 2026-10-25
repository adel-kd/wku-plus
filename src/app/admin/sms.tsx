import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function AdminSms() {
  const { hasRole } = useAuth();
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  if (!hasRole('admin')) return <Screen><PageHeader title="SMS announcements" /><EmptyState title="Admins only" /></Screen>;

  const send = async () => {
    if (!message.trim()) { setError('Write a message first.'); return; }
    if (message.trim().length > 160) { setError('Keep the message under 160 characters.'); return; }
    setBusy(true); setError(''); setResult('');
    try {
      const r = await api.sendAnnouncement(message.trim(), department.trim() || undefined);
      setResult(`Sent to ${r.sent} users${r.failed ? `; ${r.failed} failed` : ''}.`);
      setMessage('');
    } catch (e: any) { setError(e.message ?? 'Could not send messages.'); }
    finally { setBusy(false); }
  };

  return <Screen>
    <PageHeader title="SMS announcements" subtitle="Reach users by phone or department" />
    <View style={{ padding: 16 }}>
      <Card style={{ gap: 14 }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Leave department blank to message every registered user.</Text>
        <Input label="Department (optional)" placeholder="e.g. Computer Science" value={department} onChangeText={setDepartment} />
        <Input label="Message" placeholder="This feature is now live!" value={message} onChangeText={setMessage} multiline maxLength={160} style={{ minHeight: 90, textAlignVertical: 'top' }} />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        {result ? <Text style={{ color: colors.success }}>{result}</Text> : null}
        <Button label="Send SMS" onPress={send} loading={busy} />
      </Card>
    </View>
  </Screen>;
}
