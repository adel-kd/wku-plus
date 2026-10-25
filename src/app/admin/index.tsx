import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/theme';

const ITEMS: { href: string; label: string; icon: any; desc: string }[] = [
  { href: '/admin/messages', label: 'Student messages', icon: 'chatbubbles', desc: 'Read and resolve messages from students' },
  { href: '/admin/delivery-applications', label: 'Delivery applications', icon: 'bicycle', desc: 'Approve students as delivery runners' },
  { href: '/admin/vendors', label: 'Delivery vendors & menus', icon: 'fast-food', desc: 'Turn places on for delivery, set prices' },
  { href: '/admin/applications', label: 'Merchant applications', icon: 'storefront', desc: 'Approve students to sell new products' },
  { href: '/admin/users', label: 'Users & roles', icon: 'people', desc: 'Make someone a runner or admin' },
  { href: '/admin/orders', label: 'All orders', icon: 'receipt', desc: 'See every delivery in progress' },
  { href: '/admin/sms', label: 'Send SMS announcement', icon: 'megaphone', desc: 'Message all users or one department' },
  { href: '/admin/push', label: 'Push notifications', icon: 'notifications', desc: 'Notify users even when the app is closed' },
  { href: '/admin/tips', label: 'Manage student tips', icon: 'bulb', desc: 'Add, edit and delete Tips content' },
];

export default function AdminHome() {
  const { hasRole } = useAuth();
  if (!hasRole('admin')) {
    return (
      <Screen>
        <PageHeader title="Admin" />
        <EmptyState title="Admins only" subtitle="This section is restricted." />
      </Screen>
    );
  }
  return (
    <Screen>
      <PageHeader title="Admin console" subtitle="Manage WKU+ for everyone" />
      <View style={{ padding: 16, gap: 10 }}>
        {ITEMS.map((i) => (
          <Pressable
            key={i.href}
            onPress={() => router.push(i.href as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${colors.deep}1A`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={i.icon} size={20} color={colors.deep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{i.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{i.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
