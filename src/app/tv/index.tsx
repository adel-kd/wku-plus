import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LiveStream } from '@/lib/types';
import { colors } from '@/theme';
import { goBackOr } from '@/lib/navigation';

export default function TVIndex() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [matching, setMatching] = useState(false);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    let on = true;
    api.listLive().then((s) => on && setStreams(s)).catch(() => {});
    return () => { on = false; if (pollRef.current) clearTimeout(pollRef.current); };
  }, []));

  async function startMatch() {
    setMatching(true);
    try {
      const room = await new Promise<string | null>((resolve) => {
        let tries = 0;
        const tick = async () => {
          const result = await api.tvMatch();
          if (result) return resolve(result);
          if (++tries >= 20) return resolve(null);
          pollRef.current = setTimeout(tick, 3000);
        };
        tick();
      });
      if (room) router.push(`/tv/live/${room}?publish=true`);
      else { await api.tvLeave(); Alert.alert('No match yet', 'No student is waiting right now. Please try again shortly.'); }
    } catch (e) {
      Alert.alert('Could not connect', e instanceof Error ? e.message : 'Please try again.');
    } finally { setMatching(false); }
  }

  function goLive() {
    if (!profile) return;
    router.push(`/tv/live/${encodeURIComponent(`live-${profile.id}-${Date.now()}`)}?publish=true&broadcast=true`);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => goBackOr('/')} style={styles.iconButton}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
        <Image source={require('../../../assets/tiles/tv.png')} style={styles.logo} contentFit="contain" />
        <Pressable style={styles.iconButton}><Ionicons name="notifications-outline" size={21} color={colors.ink} /></Pressable>
      </View>
      <FlatList
        data={streams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
          <View style={styles.hero}>
            <View style={styles.avatar}><Ionicons name="person" size={46} color="#B5DFF2" /></View>
            <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>{matching ? 'Finding a WKU student…' : 'Ready to meet someone new?'}</Text></View>
            <View style={styles.heroActions}>
              <View style={styles.round}><Ionicons name="mic" size={20} color="#FFF" /></View>
              <Pressable onPress={startMatch} disabled={matching} style={styles.next}>
                {matching ? <ActivityIndicator color="#FFF" /> : <Ionicons name="arrow-forward" size={27} color="#FFF" />}
                <Text style={styles.nextText}>{matching ? 'Waiting' : 'Next'}</Text>
              </Pressable>
              <View style={styles.round}><Ionicons name="videocam" size={20} color="#FFF" /></View>
            </View>
          </View>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={startMatch} disabled={matching}>
              <View style={[styles.quickIcon, { backgroundColor: '#E4F7FF' }]}><Ionicons name="shuffle" size={22} color={colors.primaryDark} /></View>
              <Text style={styles.quickTitle}>Random chat</Text><Text style={styles.quickSub}>1-on-1 video match</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={goLive}>
              <View style={[styles.quickIcon, { backgroundColor: '#FFE9EA' }]}><Ionicons name="radio" size={22} color={colors.danger} /></View>
              <Text style={styles.quickTitle}>Go live</Text><Text style={styles.quickSub}>Broadcast on campus</Text>
            </Pressable>
          </View>
          <Text style={styles.section}>Live now</Text>
        </>}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="tv-outline" size={30} color={colors.muted} /><Text style={styles.emptyTitle}>No live streams yet</Text><Text style={styles.quickSub}>Be the first student to go live.</Text></View>}
        renderItem={({ item }) => <Pressable style={styles.stream} onPress={() => router.push(`/tv/live/${encodeURIComponent(item.roomName)}?publish=false`)}>
          <View style={styles.liveAvatar}><Ionicons name="person" size={23} color="#FFF" /></View>
          <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{item.hostName}</Text><Text style={styles.quickSub}>{item.title || 'Live from WKU'}</Text></View>
          <Text style={styles.livePill}>● LIVE</Text>
        </Pressable>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3FAFD' }, header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, logo: { width: 128, height: 48 }, content: { padding: 16, paddingBottom: 36 },
  hero: { height: 350, borderRadius: 28, overflow: 'hidden', backgroundColor: '#123548', alignItems: 'center', justifyContent: 'center' }, avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#1F526C', alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', bottom: 95, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#52E394' }, statusText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroActions: { position: 'absolute', bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }, round: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,.2)', alignItems: 'center', justifyContent: 'center' }, next: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, nextText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 14 }, quickCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14 }, quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, quickTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 }, quickSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  section: { color: colors.ink, fontWeight: '900', fontSize: 19, marginTop: 24, marginBottom: 10 }, empty: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', padding: 24 }, emptyTitle: { color: colors.ink, fontWeight: '800', marginTop: 8 }, stream: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }, liveAvatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }, livePill: { backgroundColor: colors.danger, color: '#FFF', fontSize: 10, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
});
