import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, Screen } from '@/components/ui';
import { PLACES } from '@/data/places';
import { api } from '@/lib/api';
import { MenuItem } from '@/lib/types';
import { colors } from '@/theme';

export default function AdminMenu() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const place = PLACES.find((p) => p.id === placeId);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (placeId) api.listMenu(placeId).then(setItems); }, [placeId]);

  const add = async () => {
    const p = Number(price);
    if (!name.trim() || !p || p <= 0) {
      Alert.alert('Missing details', 'Enter a name and a price greater than 0.');
      return;
    }
    setSaving(true);
    try {
      await api.saveMenuItem({ placeId: placeId!, name: name.trim(), description: desc.trim(), price: p, available: true });
      setName('');
      setDesc('');
      setPrice('');
      if (placeId) api.listMenu(placeId).then(setItems);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHeader title={place?.name ?? 'Menu'} subtitle="Add items and set prices" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <Card style={{ gap: 10, marginBottom: 6 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>Add a menu item</Text>
            <Input placeholder="Item name" value={name} onChangeText={setName} />
            <Input placeholder="Description (optional)" value={desc} onChangeText={setDesc} />
            <Input placeholder="Price in ETB" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Button label="Add item" small onPress={add} loading={saving} />
          </Card>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{item.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{item.price} ETB{item.description ? ` · ${item.description}` : ''}</Text>
            </View>
            <Switch
              value={item.available}
              onValueChange={(v) => api.saveMenuItem({ ...item, available: v }).then(() => { if (placeId) api.listMenu(placeId).then(setItems); })}
              trackColor={{ true: colors.primary }}
            />
            <Pressable onPress={() => api.deleteMenuItem(item.id).then(() => { if (placeId) api.listMenu(placeId).then(setItems); })} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
