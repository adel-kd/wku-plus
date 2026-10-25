import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/theme';
import { api } from '@/lib/api';

const ROLE_LABEL: Record<string, string> = {
  student: 'Student',
  merchant: 'Merchant',
  runner: 'Runner',
  admin: 'Admin',
};

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { profile, signOut, hasRole, isSampleMode } = useAuth();
  const [merchantPhoto, setMerchantPhoto] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => { if (hasRole('merchant')) api.myShop().then(shop => setMerchantPhoto(shop?.imageUrl ?? null)); else setMerchantPhoto(null); }, [profile?.id, profile?.role]);

  async function completeSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/auth/phone');
    } catch (error: any) {
      Alert.alert('Could not sign out', error.message ?? 'Please try again.');
      setSigningOut(false);
    }
  }

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Are you sure you want to sign out?')) void completeSignOut();
      return;
    }
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void completeSignOut() },
    ]);
  }

  const links: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string; show: boolean }[] = [
    { icon: 'storefront-outline', label: hasRole('admin') ? 'Gebeya admin test shop' : 'My Gebeya shop', href: '/merchant', show: hasRole('merchant', 'admin') },
    { icon: 'bag-add-outline', label: 'Become a merchant', href: '/merchant/apply', show: !hasRole('merchant', 'admin') },
    { icon: 'bicycle-outline', label: 'Runner dispatch board', href: '/delivery/runner', show: hasRole('runner') },
    { icon: 'shield-checkmark-outline', label: 'Admin console', href: '/admin', show: hasRole('admin') },
    { icon: 'videocam-outline', label: 'My live broadcasts', href: '/tv', show: true },
    { icon: 'key-outline', label: 'Change password', href: '/auth/change-password', show: true },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 24, gap: 16 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>Profile</Text>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.sky,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {merchantPhoto ? <Image source={{ uri: merchantPhoto }} style={{ width: 56, height: 56, borderRadius: 28 }} contentFit="cover" /> : <Text style={{ fontSize: 22, fontWeight: '800', color: colors.deep }}>
            {(profile?.fullName || profile?.phone || '?').trim()[0]?.toUpperCase()}
          </Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.ink }}>{profile?.fullName || 'Student'}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{profile?.phone}</Text>
          {profile?.studentId ? <Text style={{ color: colors.muted, fontSize: 12 }}>{profile.studentId}</Text> : null}
        </View>
        <View style={{ backgroundColor: `${colors.primary}1A`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>{ROLE_LABEL[profile?.role ?? 'student']}</Text>
        </View>
      </Card>

      {isSampleMode && (
        <Card style={{ backgroundColor: '#FFF7E6', borderColor: '#F0D9A0' }}>
          <Text style={{ color: '#8A6400', fontSize: 12, lineHeight: 18 }}>
            Sample mode: this device is using built-in sample data, not a live server. Connect Supabase in .env to
            make this real for every student.
          </Text>
        </Card>
      )}

      <View style={{ gap: 10 }}>
        {links
          .filter((l) => l.show)
          .map((l) => (
            <Pressable
              key={l.href}
              onPress={() => router.push(l.href as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.white,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Ionicons name={l.icon} size={20} color={colors.deep} />
              <Text style={{ flex: 1, fontWeight: '600', color: colors.ink }}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
      </View>

      <Pressable
        onPress={confirmSignOut}
        disabled={signingOut}
        style={{ alignItems: 'center', padding: 14 }}
      >
        <Text style={{ color: colors.danger, fontWeight: '700' }}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </ScrollView>
  );
}
