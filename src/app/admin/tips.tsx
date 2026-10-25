import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Tip } from '@/lib/types';
import { colors } from '@/theme';

export default function AdminTips() {
  const { hasRole } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [link, setLink] = useState('');
  const load = useCallback(() => { api.listTips().then(setTips); }, []);
  useFocusEffect(load);
  if (!hasRole('admin')) return <Screen><PageHeader title="Manage tips" /><EmptyState title="Admins only" /></Screen>;
  function reset() { setEditing(null); setTitle(''); setDescription(''); setLink(''); }
  function edit(tip: Tip) { setEditing(tip); setTitle(tip.title); setDescription(tip.description); setLink(tip.link ?? ''); }
  async function save() { if (!title.trim() || !description.trim()) return; await api.saveTip({ id: editing?.id, title: title.trim(), description: description.trim(), link: link.trim() || null }); reset(); load(); }
  function remove(id: string) { Alert.alert('Delete tip?', 'This removes it from the student Tips page.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteTip(id); load(); } }]); }
  return <Screen><PageHeader title="Manage student tips" subtitle="Add, edit or remove Tips content" /><ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
    <Card style={{ gap: 12 }}><Input label="Title" value={title} onChangeText={setTitle} /><Input label="Description" value={description} onChangeText={setDescription} multiline /><Input label="Link (optional)" value={link} onChangeText={setLink} autoCapitalize="none" /><Button label={editing ? 'Save changes' : 'Add tip'} onPress={save} />{editing ? <Button label="Cancel editing" variant="secondary" onPress={reset} /> : null}</Card>
    {tips.map(tip => <Card key={tip.id} style={{ gap: 8 }}><Text style={{ color: colors.ink, fontWeight: '800' }}>{tip.title}</Text><Text style={{ color: colors.muted }}>{tip.description}</Text>{tip.link ? <Text numberOfLines={1} style={{ color: colors.primary }}>{tip.link}</Text> : null}<View style={{ flexDirection: 'row', gap: 16 }}><Pressable onPress={() => edit(tip)}><Text style={{ color: colors.primary, fontWeight: '700' }}>Edit</Text></Pressable><Pressable onPress={() => remove(tip.id)}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable></View></Card>)}
  </ScrollView></Screen>;
}
