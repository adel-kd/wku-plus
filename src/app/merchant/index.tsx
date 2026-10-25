import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Input, Screen, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Product, Shop } from '@/lib/types';
import { colors, radius } from '@/theme';
import { GebeyaImagePicker } from '@/components/GebeyaImagePicker';

export default function MerchantDashboard() {
  const { profile, hasRole } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [savingStory, setSavingStory] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!profile) return;
    if (hasRole('merchant', 'admin')) {
      api.myShop().then(setShop);
      api.listProducts('new').then(p => setProducts(p.filter(x => x.sellerId === profile.id)));
    }
  }, [profile]));

  if (!hasRole('merchant', 'admin')) {
    return (
      <Screen>
        <PageHeader title="Merchant" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Card style={{ width: '100%', maxWidth: 480, padding: 22, gap: 16 }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: '#EAF7FD', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="storefront-outline" size={27} color={colors.primaryDark} /></View>
            <View><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 21 }}>Verified Merchant</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}><Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 30 }}>500 Br</Text><Text style={{ color: colors.muted, marginBottom: 5 }}> / month</Text></View></View>
            <View style={{ gap: 10 }}>
              {['Post products every day', 'Publish daily shop stories', 'Verified merchant badge', 'Appear in Verified Merchants'].map((benefit) => <View key={benefit} style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}><Ionicons name="checkmark-circle" size={18} color={colors.success} /><Text style={{ color: colors.ink }}>{benefit}</Text></View>)}
            </View>
            <Button label="Subscribe and apply" onPress={() => router.push('/merchant/apply')} />
            <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 11 }}>Payment is verified before merchant access is activated.</Text>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="My Shop" subtitle={shop?.name ?? 'Set up your shop below'} />
      {!shop && (
        <Card style={{ margin: 14, gap: 10, borderColor: colors.primary }}>
          <Text style={{ color: colors.ink, fontWeight: '900', fontSize: 17 }}>{hasRole('admin') ? 'Create admin test shop' : 'Finish setting up your shop'}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Your account has merchant access, but it does not have a shop record yet.</Text>
          <Input label="Shop name" value={shopName} onChangeText={setShopName} />
          <Input label="Description" value={shopDescription} onChangeText={setShopDescription} multiline />
          <Button label="Create shop" onPress={async () => { if (!shopName.trim()) return; const created = await api.createShop(shopName.trim(), shopDescription.trim()); setShop(created); }} />
        </Card>
      )}
      {shop && (
        <Card style={{ margin: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ionicons name="storefront" size={28} color={colors.primary} /><View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{shop.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{products.length} product{products.length !== 1 ? 's' : ''} listed</Text>
          </View></View>
          <GebeyaImagePicker uri={shopImage ?? shop.imageUrl} onChange={setShopImage} label="Add shop photo" />
          {shopImage ? <Button label="Save shop photo" loading={savingImage} onPress={async () => { setSavingImage(true); try { const url = await api.uploadGebeyaImage(shopImage); await api.updateShopImage(url); setShop({ ...shop, imageUrl: url }); setShopImage(null); } finally { setSavingImage(false); } }} /> : null}
        </Card>
      )}
      {shop && <Card style={{ marginHorizontal: 14, marginBottom: 14, gap: 10 }}><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 16 }}>Post today’s story</Text><Input label="Story message" value={storyText} onChangeText={setStoryText} multiline placeholder="What is new in your shop?" /><GebeyaImagePicker uri={storyImage} onChange={setStoryImage} label="Add story photo" /><Button label="Publish story" loading={savingStory} onPress={async () => { if (!storyText.trim() && !storyImage) return; setSavingStory(true); try { const imageUrl = storyImage ? await api.uploadGebeyaImage(storyImage) : null; await api.createMerchantStory(storyText.trim(), imageUrl); setStoryText(''); setStoryImage(null); Alert.alert('Story published', 'It will remain visible for 24 hours.'); } catch (error: any) { Alert.alert('Could not publish', error.message); } finally { setSavingStory(false); } }} /></Card>}
      <SectionTitle>Products</SectionTitle>
      <FlatList
        data={products}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="cube-outline" size={32} color={colors.muted} />}
            title="No products yet"
            subtitle="Add your first product to start selling"
          />
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink }}>{item.title}</Text>
              <Text style={{ color: colors.deep, fontWeight: '700' }}>{item.price} ETB</Text>
            </View>
            <Pressable onPress={() => Alert.alert('Delete?', 'Remove this product?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                await api.deleteProduct(item.id);
                setProducts(p => p.filter(x => x.id !== item.id));
              }},
            ])}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Card>
        )}
      />
      <View style={{ padding: 14 }}>
        <Button label={shop ? '+ Add Product' : 'Create a shop before adding products'} onPress={() => router.push('/merchant/product/new')} variant="secondary" disabled={!shop} />
      </View>
    </Screen>
  );
}
