import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { LeafletMap } from '@/components/LeafletMap';
import { Chip, Screen } from '@/components/ui';
import { CATEGORIES, CATEGORY_BY_ID } from '@/data/categories';
import { CategoryId, PLACES } from '@/data/places';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { useLocation } from '@/lib/useLocation';
import { colors } from '@/theme';

export default function TourIndex() {
  const { coords, granted } = useLocation();
  const [active, setActive] = useState<CategoryId | 'all'>('all');

  const places = useMemo(() => {
    const list = active === 'all' ? PLACES : PLACES.filter((p) => p.category === active);
    if (!coords) return list.map((p) => ({ ...p, dist: null as number | null }));
    return list
      .map((p) => ({ ...p, dist: distanceMeters(coords, { lat: p.lat, lng: p.lng }) }))
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
  }, [active, coords]);

  const markers = places.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    label: p.name,
    color: CATEGORY_BY_ID[p.category].color,
  }));

  return (
    <Screen>
      <PageHeader title="WKU Campus Map" subtitle={`${PLACES.length} places around Wolkite University`} />
      <View style={{ padding: 14, paddingBottom: 0 }}>
        <LeafletMap
          markers={markers}
          me={coords}
          height={240}
          onMarkerPress={(id) => router.push(`/tour/${id}`)}
        />
        {granted === false && (
          <Text style={{ color: colors.muted, fontSize: 11.5, marginTop: 6 }}>
            Location permission is off, so distances use the campus center. Enable it in Settings for live distances.
          </Text>
        )}
      </View>

      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        horizontal={false}
        ListHeaderComponent={
          <FlatList
            data={[{ id: 'all', label: 'All', icon: 'apps', color: colors.deep }, ...CATEGORIES]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingVertical: 12 }}
            renderItem={({ item }) => (
              <Chip
                label={item.label}
                color={item.color}
                active={active === item.id}
                onPress={() => setActive(item.id as CategoryId | 'all')}
                icon={<Ionicons name={item.icon as any} size={14} color={active === item.id ? colors.white : item.color} />}
              />
            )}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => {
          const cat = CATEGORY_BY_ID[item.category];
          return (
            <Pressable
              onPress={() => router.push(`/tour/${item.id}`)}
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
                <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{cat.label}</Text>
                </View>
              </View>
              {item.dist != null && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 13 }}>{formatDistance(item.dist)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 10 }}>away</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
