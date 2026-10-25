import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { LeafletMap } from '@/components/LeafletMap';
import { EmptyState, Screen } from '@/components/ui';
import { PLACES } from '@/data/places';
import { api } from '@/lib/api';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { Vendor } from '@/lib/types';
import { useLocation } from '@/lib/useLocation';
import { colors } from '@/theme';

export default function DeliveryIndex() {
  const { coords } = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let on = true;
      api.listVendors().then((v) => on && setVendors(v.filter((x) => x.active)));
      setLoading(false);
      return () => {
        on = false;
      };
    }, []),
  );

  const places = useMemo(() => {
    const byId = new Set(vendors.map((v) => v.placeId));
    const list = PLACES.filter((p) => byId.has(p.id));
    if (!coords) return list.map((p) => ({ ...p, dist: null as number | null }));
    return list
      .map((p) => ({ ...p, dist: distanceMeters(coords, { lat: p.lat, lng: p.lng }) }))
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
  }, [vendors, coords]);

  const markers = places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, label: p.name, color: colors.primary }));

  return (
    <Screen>
      <PageHeader title="Delivery" subtitle="Order from a campus vendor and track your runner" />
      <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
        <Pressable onPress={() => router.push('/delivery/apply')} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 15, backgroundColor: '#EFF8FC', borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="bicycle-outline" size={22} color={colors.primaryDark} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '800' }}>Deliver with WKU+</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>Free student runner application</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </View>
      <View style={{ padding: 14, paddingBottom: 0 }}>
        <LeafletMap markers={markers} me={coords} height={220} onMarkerPress={(id) => router.push(`/delivery/menu/${id}`)} />
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        ListEmptyComponent={
          loading ? undefined : <EmptyState icon={<Ionicons name="storefront-outline" size={36} color={colors.muted} />} title="No open vendors yet" subtitle="Check back soon" />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/delivery/menu/${item.id}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Image source={{ uri: item.image }} style={{ width: 58, height: 58, borderRadius: 12 }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }}>{item.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Tap to see menu</Text>
            </View>
            {item.dist != null && (
              <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 13 }}>{formatDistance(item.dist)}</Text>
            )}
          </Pressable>
        )}
      />
    </Screen>
  );
}
