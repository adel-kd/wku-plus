import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';
import { DashboardVideo } from '@/components/DashboardVideo';

const tiles = [
  { title: 'WKU Campus Map', subtitle: 'Dedicated OSM & tour', href: '/map', image: require('../../../assets/tiles/tour.png') },
  { title: 'Gebeya', subtitle: 'Buy, sell & offer services', href: '/gebeya', image: require('../../../assets/tiles/gebeya.png') },
  { title: 'Student tips', subtitle: 'Internships & scholarships', href: '/tips', image: require('../../../assets/tiles/tips.png') },
  { title: 'WKU Cinema', subtitle: 'Real movie discovery', href: '/cinema', image: require('../../../assets/tiles/cinema.png') },
  { title: 'WKU TV', subtitle: 'Random chat & live video', href: '/tv', image: require('../../../assets/tiles/tv.png') },
  { title: 'Delivery', subtitle: 'Cafes, meals & student riders', href: '/delivery', image: require('../../../assets/tiles/delivery.png') },
] as const;

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || profile?.username || 'Student';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.welcome}>
            <Image source={require('../../../assets/logo.png')} style={styles.brand} contentFit="contain" />
            <View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            </View>
          </View>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={styles.avatar}><Ionicons name="person" size={21} color={colors.deep} /></Pressable>
          </Link>
        </View>

        <DashboardVideo />

        <View style={styles.grid}>
          {tiles.map((tile) => (
            <Link key={tile.title} href={tile.href as any} asChild>
              <Pressable style={styles.card}>
                <View style={styles.art}>
                  <Image source={tile.image} style={styles.logo} contentFit="contain" />
                </View>
                <View>
                  <Text style={styles.title}>{tile.title}</Text>
                  <Text style={styles.subtitle}>{tile.subtitle}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => Linking.openURL('https://t.me/+uM61pqXPQ5ZmNTZk')}>
            <View style={styles.actionIcon}><Ionicons name="people-outline" size={21} color={colors.primaryDark} /></View>
            <View style={{ flex: 1 }}><Text style={styles.actionTitle}>Join the community</Text><Text style={styles.actionSubtitle}>Open the WKU+ Telegram group</Text></View>
            <Ionicons name="open-outline" size={18} color={colors.muted} />
          </Pressable>
          <Link href="/support" asChild>
            <Pressable style={styles.actionButton}>
              <View style={styles.actionIcon}><Ionicons name="chatbox-ellipses-outline" size={21} color={colors.primaryDark} /></View>
              <View style={{ flex: 1 }}><Text style={styles.actionTitle}>Get in touch with admin</Text><Text style={styles.actionSubtitle}>Send a private in-app message</Text></View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 16, paddingBottom: 30, alignItems: 'center' },
  header: { width: '100%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 3 },
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 11 }, brand: { width: 48, height: 38 },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  greeting: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  grid: { width: '100%', maxWidth: 560, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { width: '48.7%', aspectRatio: 1.04, maxHeight: 210, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D7EAF3', padding: 15, justifyContent: 'space-between' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  art: { height: 82, alignItems: 'center', justifyContent: 'center' },
  logo: { width: '94%', height: 70 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 15 },
  actions: { width: '100%', maxWidth: 560, gap: 10, marginTop: 18 },
  actionButton: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13, backgroundColor: '#FFF' },
  actionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EAF7FD', alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, actionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
