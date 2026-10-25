import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import { colors } from '@/theme';

export default function AdminMessages() {
  const [items, setItems] = useState<any[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('support_messages').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function resolve(id: string) { await supabase.from('support_messages').update({ status: 'resolved' }).eq('id', id); load(); }
  return <Screen>
    <PageHeader title="Student messages" subtitle="Questions sent from inside WKU+" />
    <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState title="No messages" subtitle="New student messages will appear here." />}
      renderItem={({ item }) => <View style={styles.card}>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{item.user_name || 'Student'}</Text><Text style={styles.meta}>{item.user_phone}</Text></View><Text style={[styles.status, item.status === 'resolved' && styles.done]}>{item.status}</Text></View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        {item.status !== 'resolved' && <Pressable onPress={() => resolve(item.id)} style={styles.resolve}><Ionicons name="checkmark" size={16} color={colors.primaryDark} /><Text style={styles.resolveText}>Mark resolved</Text></Pressable>}
      </View>} />
  </Screen>;
}
const styles = StyleSheet.create({ list: { padding: 16, gap: 12 }, card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16 }, row: { flexDirection: 'row', alignItems: 'flex-start' }, name: { fontWeight: '800', color: colors.ink }, meta: { color: colors.muted, fontSize: 12, marginTop: 2 }, message: { color: colors.ink, lineHeight: 21, marginTop: 14 }, date: { color: colors.muted, fontSize: 11, marginTop: 10 }, status: { color: colors.primaryDark, backgroundColor: '#EAF7FD', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, done: { color: colors.success, backgroundColor: '#EAF8F1' }, resolve: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: 13 }, resolveText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 } });
