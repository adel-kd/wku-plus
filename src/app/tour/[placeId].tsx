import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { LeafletMap } from '@/components/LeafletMap';
import { Badge, Button, Card, Screen } from '@/components/ui';
import { CATEGORY_BY_ID } from '@/data/categories';
import { PLACES } from '@/data/places';
import { bearingDegrees, compass, distanceMeters, formatDistance, walkingMinutes } from '@/lib/geo';
import { useLocation } from '@/lib/useLocation';
import { colors } from '@/theme';

export default function PlaceDetail() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { coords } = useLocation();
  const place = PLACES.find((p) => p.id === placeId);

  if (!place) {
    return (
      <Screen>
        <PageHeader title="Not found" />
        <Text style={{ padding: 20 }}>This place could not be found.</Text>
      </Screen>
    );
  }

  const cat = CATEGORY_BY_ID[place.category];
  const dist = coords ? distanceMeters(coords, { lat: place.lat, lng: place.lng }) : null;
  const bearing = coords ? bearingDegrees(coords, { lat: place.lat, lng: place.lng }) : null;
  const isFood = place.category === 'food';

  return (
    <Screen>
      <PageHeader title={place.name} subtitle={cat.label} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Image source={{ uri: place.image }} style={{ width: '100%', height: 190, borderRadius: 18 }} contentFit="cover" />

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge label={cat.label} />
            {isFood && <Badge label="Delivery available" tone="success" />}
          </View>
          {dist != null ? (
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Stat icon="walk" label="Distance" value={formatDistance(dist)} />
              <Stat icon="time" label="Walking" value={`${walkingMinutes(dist)} min`} />
              {bearing != null && <Stat icon="compass" label="Direction" value={compass(bearing)} />}
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 12 }}>Turn on location to see your distance to this place.</Text>
          )}
        </Card>

        <LeafletMap
          markers={[{ id: place.id, lat: place.lat, lng: place.lng, label: place.name, color: cat.color, emphasize: true }]}
          me={coords}
          routeTo={{ lat: place.lat, lng: place.lng }}
          center={coords ?? undefined}
          height={220}
        />

        {isFood && (
          <Link href={`/delivery/menu/${place.id}`} asChild>
            <Button label="See menu & order delivery" icon={<Ionicons name="fast-food" size={18} color="#fff" />} />
          </Link>
        )}
      </ScrollView>
    </Screen>
  );
}

const Stat: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
    </View>
    <Text style={{ fontWeight: '800', color: colors.ink, fontSize: 15, marginTop: 2 }}>{value}</Text>
  </View>
);
