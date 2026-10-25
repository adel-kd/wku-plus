import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { colors } from '@/theme';

export default function DeliveryApplications() {
  const [items, setItems] = useState<any[]>([]);
  const load = useCallback(async () => { const { data } = await supabase.from('delivery_applications').select('*').order('created_at', { ascending: false }); setItems(data ?? []); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function decide(item: any, approved: boolean) {
    await supabase.from('delivery_applications').update({ status: approved ? 'approved' : 'rejected' }).eq('id', item.id);
    if (approved) await supabase.from('profiles').update({ role: 'runner' }).eq('id', item.user_id);
    load();
  }
  return <Screen><PageHeader title="Delivery applications" subtitle="Approve student runners" />
    <FlatList data={items} keyExtractor={(x) => x.id} contentContainerStyle={{ padding: 16, gap: 10 }} ListEmptyComponent={<EmptyState title="No delivery applications" />}
      renderItem={({ item }) => <Card style={{ gap: 8 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '800', color: colors.ink }}>{item.user_name}</Text><Badge label={item.status} tone={item.status === 'pending' ? 'warn' : item.status === 'approved' ? 'success' : 'danger'} /></View><Text style={{ color: colors.muted, fontSize: 12 }}>{item.user_phone}</Text><Text style={{ color: colors.ink, lineHeight: 20 }}>{item.reason}</Text>{item.status === 'pending' && <View style={{ flexDirection: 'row', gap: 8 }}><Button label="Approve" small onPress={() => decide(item, true)} /><Button label="Reject" small variant="danger" onPress={() => decide(item, false)} /></View>}</Card>} />
  </Screen>;
}
