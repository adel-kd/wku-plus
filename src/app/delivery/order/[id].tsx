import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { LeafletMap } from '@/components/LeafletMap';
import { Button, Card } from '@/components/ui';
import { PLACES } from '@/data/places';
import { api } from '@/lib/api';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { Order, OrderStatus } from '@/lib/types';
import { colors } from '@/theme';

const STEPS: { key: OrderStatus; label: string; icon: any }[] = [
  { key: 'placed', label: 'Order placed', icon: 'receipt' },
  { key: 'accepted', label: 'Runner assigned', icon: 'person' },
  { key: 'picked_up', label: 'On the way', icon: 'bicycle' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done' },
];

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let on = true;
    const load = () => api.getOrder(id).then((o) => on && setOrder(o));
    load();
    const t = setInterval(load, 4000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [id]);

  if (!order) {
    return (
      <>
        <PageHeader title="Order" />
        <Text style={{ padding: 20 }}>Loading…</Text>
      </>
    );
  }

  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.key === order.status));
  const drop = PLACES.find((p) => p.id === order.dropPlaceId);
  const runnerDist =
    order.runnerLat && order.runnerLng && drop
      ? distanceMeters({ lat: order.runnerLat, lng: order.runnerLng }, { lat: drop.lat, lng: drop.lng })
      : null;

  const cancel = () =>
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => api.cancelOrder(order.id).then(() => api.getOrder(order.id).then(setOrder)),
      },
    ]);

  return (
    <>
      <PageHeader title={order.placeName} subtitle={`Order to ${order.dropName}`} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {order.status === 'cancelled' ? (
          <Card>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>This order was cancelled.</Text>
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: done ? colors.primary : colors.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: done ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons name={s.icon} size={16} color={done ? '#fff' : colors.muted} />
                  </View>
                  <Text style={{ color: done ? colors.ink : colors.muted, fontWeight: done ? '700' : '500' }}>{s.label}</Text>
                </View>
              );
            })}
          </Card>
        )}

        {order.runnerName && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="bicycle" size={22} color={colors.deep} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{order.runnerName}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Your student runner</Text>
            </View>
            {runnerDist != null && <Text style={{ fontWeight: '800', color: colors.primary }}>{formatDistance(runnerDist)} away</Text>}
          </Card>
        )}

        {order.runnerLat && order.runnerLng && drop && (
          <LeafletMap
            markers={[{ id: 'drop', lat: drop.lat, lng: drop.lng, label: order.dropName, color: colors.deep }]}
            runner={{ lat: order.runnerLat, lng: order.runnerLng }}
            routeTo={{ lat: drop.lat, lng: drop.lng }}
            me={{ lat: order.runnerLat, lng: order.runnerLng }}
            height={220}
          />
        )}

        <Card style={{ gap: 6 }}>
          {order.lines.map((l) => (
            <View key={l.menuItemId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.ink }}>{l.qty}x {l.name}</Text>
              <Text style={{ color: colors.ink }}>{l.price * l.qty} ETB</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800' }}>Total (cash on delivery)</Text>
            <Text style={{ fontWeight: '800' }}>{order.total} ETB</Text>
          </View>
          {order.note ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Note: {order.note}</Text> : null}
        </Card>

        {order.status === 'placed' && <Button label="Cancel order" variant="danger" onPress={cancel} />}
      </ScrollView>
    </>
  );
}
