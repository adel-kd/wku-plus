import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Input, Screen } from '@/components/ui';
import { PLACES } from '@/data/places';
import { api, ORDER_FEE } from '@/lib/api';
import { MenuItem, OrderLine } from '@/lib/types';
import { colors, radius } from '@/theme';

const DORMS = PLACES.filter((p) => p.category === 'dorms');

export default function MenuScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const place = PLACES.find((p) => p.id === placeId);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dropPlaceId, setDropPlaceId] = useState(DORMS[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (placeId) api.listMenu(placeId).then(setMenu);
  }, [placeId]);

  const lines: OrderLine[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const m = menu.find((x) => x.id === id)!;
          return { menuItemId: id, name: m.name, price: m.price, qty };
        }),
    [cart, menu],
  );
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const add = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  const placeOrder = async () => {
    if (!place || !lines.length) return;
    setPlacing(true);
    try {
      const drop = PLACES.find((p) => p.id === dropPlaceId)!;
      const order = await api.placeOrder({
        placeId: place.id,
        placeName: place.name,
        lines,
        dropPlaceId: drop.id,
        dropName: drop.name,
        note,
      });
      setCheckoutOpen(false);
      setCart({});
      router.replace(`/delivery/order/${order.id}`);
    } catch (e: any) {
      Alert.alert('Could not place order', e.message ?? 'Try again');
    } finally {
      setPlacing(false);
    }
  };

  if (!place) {
    return (
      <Screen>
        <PageHeader title="Not found" />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title={place.name} subtitle="Menu" />
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 10 }}
        ListEmptyComponent={
          <EmptyState icon={<Ionicons name="fast-food-outline" size={36} color={colors.muted} />} title="No menu yet" subtitle="The vendor hasn't added items yet. Check back soon." />
        }
        renderItem={({ item }) => {
          const qty = cart[item.id] ?? 0;
          return (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14.5 }}>{item.name}</Text>
                {item.description ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{item.description}</Text> : null}
                <Text style={{ color: colors.deep, fontWeight: '700', marginTop: 4 }}>{item.price} ETB</Text>
              </View>
              {qty === 0 ? (
                <Pressable onPress={() => add(item.id, 1)} style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Add</Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Pressable onPress={() => add(item.id, -1)} hitSlop={8}>
                    <Ionicons name="remove-circle" size={24} color={colors.primary} />
                  </Pressable>
                  <Text style={{ fontWeight: '800', minWidth: 16, textAlign: 'center' }}>{qty}</Text>
                  <Pressable onPress={() => add(item.id, 1)} hitSlop={8}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </Pressable>
                </View>
              )}
            </Card>
          );
        }}
      />

      {lines.length > 0 && (
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 18 }}>
          <Button label={`Checkout · ${subtotal} ETB`} onPress={() => setCheckoutOpen(true)} icon={<Ionicons name="cart" size={18} color="#fff" />} />
        </View>
      )}

      <Modal visible={checkoutOpen} animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <Screen>
          <PageHeader title="Checkout" subtitle={place.name} onBack={() => setCheckoutOpen(false)} />
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Card style={{ gap: 6 }}>
              {lines.map((l) => (
                <View key={l.menuItemId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.ink }}>{l.qty}x {l.name}</Text>
                  <Text style={{ color: colors.ink }}>{l.price * l.qty} ETB</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Subtotal</Text>
                <Text style={{ color: colors.muted }}>{subtotal} ETB</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted }}>Runner fee</Text>
                <Text style={{ color: colors.muted }}>{ORDER_FEE} ETB</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '800', color: colors.ink }}>Total (pay on delivery)</Text>
                <Text style={{ fontWeight: '800', color: colors.ink }}>{subtotal + ORDER_FEE} ETB</Text>
              </View>
            </Card>

            <Text style={{ fontWeight: '700', color: colors.ink }}>Deliver to</Text>
            <FlatList
              data={DORMS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(d) => d.id}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setDropPlaceId(item.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: radius.pill,
                    backgroundColor: dropPlaceId === item.id ? colors.primary : colors.white,
                    borderWidth: 1,
                    borderColor: dropPlaceId === item.id ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: dropPlaceId === item.id ? '#fff' : colors.ink, fontWeight: '600', fontSize: 12.5 }}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Input label="Note for the runner (optional)" placeholder="e.g. Call when you arrive" value={note} onChangeText={setNote} />
            <Button label={`Place order · ${subtotal + ORDER_FEE} ETB`} onPress={placeOrder} loading={placing} />
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center' }}>Pay the runner in cash on delivery.</Text>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}
