import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Badge, EmptyState, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { colors } from '@/theme';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useFocusEffect(
    useCallback(() => {
      let on = true;
      const load = () => api.allOrders().then((o) => on && setOrders(o));
      load();
      const t = setInterval(load, 6000);
      return () => { on = false; clearInterval(t); };
    }, []),
  );

  return (
    <Screen>
      <PageHeader title="All orders" subtitle={`${orders.length} total`} />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<EmptyState title="No orders yet" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/delivery/order/${item.id}`)} style={{ backgroundColor: colors.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{item.placeName}</Text>
              <Badge label={item.status} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{item.userName} → {item.dropName}</Text>
            <Text style={{ color: colors.deep, fontWeight: '700', fontSize: 12 }}>{item.total} ETB{item.runnerName ? ` · ${item.runnerName}` : ''}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
