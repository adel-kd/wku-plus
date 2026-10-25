import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function AdminPush() {
  const { hasRole } = useAuth();
  const [title, setTitle] = useState('WKU+');
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  if (!hasRole('admin')) return <Screen><PageHeader title="Push notifications" /><EmptyState title="Admins only" /></Screen>;
  async function send() {
    if (!title.trim() || !message.trim()) return setResult('Add a title and message.');
    setBusy(true); setResult('');
    try { const response = await api.sendPushNotification(title.trim(), message.trim(), department.trim() || undefined); setResult(`Sent to ${response.sent} registered devices.`); setMessage(''); }
    catch (error: any) { setResult(error.message ?? 'Could not send notification.'); }
    finally { setBusy(false); }
  }
  return <Screen><PageHeader title="Push notifications" subtitle="Reach users even when WKU+ is closed" /><View style={{ padding: 16 }}><Card style={{ gap: 14 }}>
    <Text style={{ color: colors.muted, fontSize: 13 }}>Leave department blank to notify every registered device.</Text>
    <Input label="Department (optional)" value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science" />
    <Input label="Notification title" value={title} onChangeText={setTitle} maxLength={100} />
    <Input label="Message" value={message} onChangeText={setMessage} multiline maxLength={500} style={{ minHeight: 100, textAlignVertical: 'top' }} />
    {result ? <Text style={{ color: colors.muted }}>{result}</Text> : null}
    <Button label="Send notification" onPress={send} loading={busy} />
  </Card></View></Screen>;
}
