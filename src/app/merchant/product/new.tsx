import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { GebeyaImagePicker } from '@/components/GebeyaImagePicker';

export default function NewProduct() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !price.trim()) return Alert.alert('Fill title and price');
    setSaving(true);
    try {
      const imageUrl = imageUri ? await api.uploadGebeyaImage(imageUri) : null;
      await api.createProduct({
        kind: 'new',
        shopId: null,
        title: title.trim(),
        description: desc.trim(),
        price: Number(price),
        condition: 'New',
        imageUrl,
      });
      Alert.alert('Product added!');
      goBackOr('/merchant');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <PageHeader title="Add Product" subtitle="New item for your shop" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Input label="Product name" value={title} onChangeText={setTitle} />
        <Input label="Description" value={desc} onChangeText={setDesc} multiline />
        <Input label="Price (ETB)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <GebeyaImagePicker uri={imageUri} onChange={setImageUri} label="Add product photo" />
        <Button label={saving ? 'Adding…' : 'Add Product'} onPress={submit} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
