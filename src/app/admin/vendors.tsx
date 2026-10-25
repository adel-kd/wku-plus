import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Switch, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/ui';
import { PLACES } from '@/data/places';
import { api } from '@/lib/api';
import { Vendor } from '@/lib/types';
import { colors } from '@/theme';

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});

  const load = useCallback(() => {
    api.listVendors().then((list) => setVendors(Object.fromEntries(list.map((v) => [v.placeId, v]))));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (placeId: string, value: boolean) => {
    const current = vendors[placeId];
    await api.setVendor(placeId, value, current?.description ?? 'Campus vendor');
    load();
  };

  return (
    <Screen>
      <PageHeader title="Delivery vendors" subtitle="Switch a place on, then set its menu & prices" />
      <FlatList
        data={PLACES}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const active = !!vendors[item.id]?.active;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.ink }}>{item.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{item.category}</Text>
              </View>
              {active && (
                <Pressable onPress={() => router.push(`/admin/menu/${item.id}`)} hitSlop={8}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
              )}
              <Switch value={active} onValueChange={(v) => toggle(item.id, v)} trackColor={{ true: colors.primary }} />
            </View>
          );
        }}
      />
    </Screen>
  );
}
