import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLocation } from '@/lib/useLocation';
import { Order } from '@/lib/types';
import { colors } from '@/theme';

export default function RunnerDashboard() {
  const { hasRole } = useAuth();
  const { coords } = useLocation();
  const [open, setOpen] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [tab, setTab] = useState<'open' | 'mine'>('open');

  const load = useCallback(() => {
    api.openOrders().then(setOpen);
    api.runnerOrders().then(setMine);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 5000);
      return () => clearInterval(t);
    }, [load]),
  );

  // Push live location for any order currently being delivered.
  useEffect(() => {
    if (!coords) return;
    mine
      .filter((o) => o.status === 'accepted' || o.status === 'picked_up')
      .forEach((o) => api.updateRunnerLocation(o.id, coords.lat, coords.lng));
  }, [coords, mine]);

  if (!hasRole('runner', 'admin')) {
    return (
      <Screen>
        <PageHeader title="Runner board" />
        <EmptyState title="Runners only" subtitle="Ask an admin to make your account a runner." />
      </Screen>
    );
  }

  const accept = async (id: string) => {
    try {
      await api.acceptOrder(id);
      load();
      setTab('mine');
    } catch (e: any) {
      Alert.alert('Could not accept', e.message ?? 'Someone else may have taken it');
      load();
    }
  };

  const activeOrders = mine.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <Screen>
      <PageHeader title="Runner dispatch" subtitle="Deliver orders and earn the student runner fee" />
      <View style={{ flexDirection: 'row', padding: 14, gap: 8 }}>
        {(['open', 'mine'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: tab === t ? colors.primary : colors.white,
              borderWidth: 1,
              borderColor: tab === t ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: tab === t ? '#fff' : colors.ink, fontWeight: '700' }}>
              {t === 'open' ? `Open (${open.length})` : `My deliveries (${activeOrders.length})`}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={tab === 'open' ? open : activeOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="cube-outline" size={36} color={colors.muted} />} title={tab === 'open' ? 'No open orders' : 'No active deliveries'} />}
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: colors.ink }}>{item.placeName}</Text>
              <Badge label={`${item.fee} ETB fee`} tone="success" />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{item.lines.map((l) => `${l.qty}x ${l.name}`).join(', ')}</Text>
            <Text style={{ color: colors.ink, fontSize: 13 }}>Deliver to: {item.dropName}</Text>
            {item.note ? <Text style={{ color: colors.muted, fontSize: 12 }}>Note: {item.note}</Text> : null}
            {tab === 'open' ? (
              <Button label="Accept delivery" small onPress={() => accept(item.id)} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {item.status === 'accepted' && (
                  <Button label="Picked up" small onPress={() => api.setOrderStatus(item.id, 'picked_up').then(load)} />
                )}
                {item.status === 'picked_up' && (
                  <Button label="Mark delivered" small variant="secondary" onPress={() => api.setOrderStatus(item.id, 'delivered').then(load)} />
                )}
                <Button label="Track" small variant="ghost" onPress={() => router.push(`/delivery/order/${item.id}`)} />
              </View>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
