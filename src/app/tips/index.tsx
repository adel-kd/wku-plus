import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Card, EmptyState, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { Tip } from '@/lib/types';
import { colors } from '@/theme';

export default function TipsIndex() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => { let active = true; setLoading(true); api.listTips().then(rows => active && setTips(rows)).finally(() => active && setLoading(false)); return () => { active = false; }; }, []));
  return <Screen><PageHeader title="Student Tips" subtitle="Scholarships, internships and useful resources" />
    {loading ? <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} /> : <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 10 }}>
      {!tips.length ? <EmptyState title="No tips yet" subtitle="New opportunities will appear here." /> : tips.map(tip => <Pressable key={tip.id} disabled={!tip.link} onPress={() => tip.link && Linking.openURL(tip.link)}><Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="bulb-outline" size={20} color={colors.white} /></View><View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.ink, fontWeight: '800' }}>{tip.title}</Text><Text style={{ color: colors.muted, lineHeight: 19 }}>{tip.description}</Text>{tip.link ? <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 3 }}>Open link</Text> : null}</View></Card></Pressable>)}
    </ScrollView>}
  </Screen>;
}
