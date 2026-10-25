import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { colors } from '@/theme';

const STATUS_TONE: Record<OrderStatus, 'success' | 'warn' | 'danger' | 'info'> = {
  placed: 'warn',
  accepted: 'info',
  picked_up: 'info',
  delivered: 'success',
  cancelled: 'danger',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Waiting for a runner',
  accepted: 'Runner assigned',
  picked_up: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersTab() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      api
        .myOrders()
        .then((o) => active && setOrders(o))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>My Orders</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Track your food on its way to you</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 18, gap: 12 }}
        refreshing={loading}
        onRefresh={() => api.myOrders().then(setOrders)}
        ListEmptyComponent={loading ? undefined : (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={40} color={colors.muted} />}
              title="No orders yet"
              subtitle="Order food from the Delivery tile on Home"
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/delivery/order/${item.id}`)}>
            <Card style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: colors.ink, fontSize: 15 }}>{item.placeName}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {item.lines.map((l) => `${l.qty}x ${l.name}`).join(', ')}
                  </Text>
                </View>
                <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>To: {item.dropName}</Text>
                <Text style={{ fontWeight: '700', color: colors.deep }}>{item.total} ETB</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
