import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Chip, EmptyState, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MerchantStory, Product, ProductKind, Shop } from '@/lib/types';
import { colors, radius } from '@/theme';

export default function GebeyaIndex() {
  const { hasRole } = useAuth();
  const [kind, setKind] = useState<ProductKind>('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stories, setStories] = useState<MerchantStory[]>([]);

  useFocusEffect(
    useCallback(() => {
      let on = true;
      api.listProducts(kind).then((p) => on && setProducts(p));
      if (kind === 'new') { api.listShops().then((s) => on && setShops(s)); api.listMerchantStories().then((s) => on && setStories(s)); }
      return () => { on = false; };
    }, [kind]),
  );

  return (
    <Screen>
      <PageHeader
        title="Gebeya"
        subtitle="Buy and sell on campus"
        right={
          <Pressable
            onPress={() => router.push(kind === 'new' ? '/merchant' : '/gebeya/used/new')}
            style={{ backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>+ Sell</Text>
          </Pressable>
        }
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 14 }}>
        <Chip label="Shops (new)" active={kind === 'new'} onPress={() => setKind('new')} />
        <Chip label="Used marketplace" active={kind === 'used'} onPress={() => setKind('used')} />
      </View>
      {kind === 'used' && !hasRole('admin') && (
        <Text style={{ color: colors.muted, fontSize: 11.5, paddingHorizontal: 14, marginTop: -8, marginBottom: 8 }}>
          Any student can post one used item per week.
        </Text>
      )}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 14 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListHeaderComponent={kind === 'new' && (stories.length || shops.length) ? <View style={{ width: '100%', marginBottom: 4, gap: 16 }}>{stories.length ? <View><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 17, marginBottom: 10 }}>Merchant stories</Text><FlatList horizontal showsHorizontalScrollIndicator={false} data={stories} keyExtractor={(story) => story.id} contentContainerStyle={{ gap: 10 }} renderItem={({ item: story }) => <View style={{ width: 180, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, overflow: 'hidden', backgroundColor: colors.white }}>{story.imageUrl ? <Image source={{ uri: story.imageUrl }} style={{ width: '100%', height: 110 }} contentFit="cover" /> : <View style={{ height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7FD' }}>{story.shopImageUrl ? <Image source={{ uri: story.shopImageUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} contentFit="cover" /> : <Ionicons name="storefront" size={28} color={colors.primaryDark} />}</View>}<View style={{ padding: 10 }}><Text numberOfLines={1} style={{ color: colors.ink, fontWeight: '800' }}>{story.shopName || story.merchantName}</Text><Text numberOfLines={3} style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{story.text}</Text></View></View>} /></View> : null}{shops.length ? <View><Text style={{ color: colors.ink, fontWeight: '900', fontSize: 17, marginBottom: 10 }}>Verified merchants</Text><FlatList horizontal showsHorizontalScrollIndicator={false} data={shops} keyExtractor={(s) => s.id} contentContainerStyle={{ gap: 9 }} renderItem={({ item: shop }) => <View style={{ width: 150, borderRadius: 16, backgroundColor: '#F3FAFD', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>{shop.imageUrl ? <Image source={{ uri: shop.imageUrl }} style={{ width: '100%', height: 82 }} contentFit="cover" /> : <View style={{ height: 62, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="storefront-outline" size={28} color={colors.primaryDark} /></View>}<View style={{ padding: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ionicons name="checkmark-circle" size={17} color={colors.primaryDark} /><Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontWeight: '800' }}>{shop.name}</Text></View><Text numberOfLines={2} style={{ color: colors.muted, fontSize: 10, marginTop: 3 }}>{shop.description || 'Verified WKU merchant'}</Text></View></View>} /></View> : null}</View> : undefined}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="pricetags-outline" size={36} color={colors.muted} />}
            title={kind === 'new' ? 'No shops yet' : 'No used items yet'}
            subtitle={kind === 'new' ? 'Approved merchants will show up here' : 'Be the first to post this week'}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}
            onPress={() => {}}
          >
            <View style={{ width: '100%', height: 110, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="image-outline" size={30} color={colors.white} />
              )}
            </View>
            <View style={{ padding: 10, gap: 4 }}>
              <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.ink, fontSize: 13 }}>{item.title}</Text>
              <Text style={{ color: colors.deep, fontWeight: '800', fontSize: 14 }}>{item.price} ETB</Text>
              <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11 }}>
                {item.kind === 'new' ? item.shopName : `${item.condition} · ${item.sellerName}`}
              </Text>
              {item.kind === 'new' && item.verifiedSeller && <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>✓ Verified merchant</Text>}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
