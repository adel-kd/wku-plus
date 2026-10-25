import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme';
import { GebeyaImagePicker } from '@/components/GebeyaImagePicker';

export default function PostUsedItem() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [nextAt, setNextAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    api.nextUsedPostAt().then(setNextAt);
  }, []);

  const blocked = nextAt && nextAt > new Date();

  async function submit() {
    if (!title.trim() || !price.trim()) return Alert.alert('Fill title and price');
    setSaving(true);
    try {
      const imageUrl = imageUri ? await api.uploadGebeyaImage(imageUri) : null;
      await api.createProduct({
        kind: 'used',
        shopId: null,
        title: title.trim(),
        description: desc.trim(),
        price: Number(price),
        condition,
        imageUrl,
      });
      Alert.alert('Posted!', 'Your used item is now listed.');
      goBackOr('/gebeya');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Post Used Item" subtitle="One per week · any student" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {blocked && (
          <Text style={{ color: colors.warn, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
            You can post again on {nextAt!.toLocaleDateString()}.
          </Text>
        )}
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Calculus textbook" editable={!blocked} />
        <Input label="Description (optional)" value={desc} onChangeText={setDesc} placeholder="Condition details, contact info..." multiline editable={!blocked} />
        <Input label="Price (ETB)" value={price} onChangeText={setPrice} keyboardType="numeric" editable={!blocked} />
        <Input label="Condition" value={condition} onChangeText={setCondition} placeholder="New / Good / Fair / Poor" editable={!blocked} />
        <GebeyaImagePicker uri={imageUri} onChange={setImageUri} label="Add product photo" />
        <Button label={saving ? 'Posting…' : 'Post Item'} onPress={submit} loading={saving} disabled={!!blocked} />
      </ScrollView>
    </Screen>
  );
}
