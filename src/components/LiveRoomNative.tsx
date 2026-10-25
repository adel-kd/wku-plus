import { Ionicons } from '@expo/vector-icons';
import {
  AudioSession,
  LiveKitRoom,
  TrackReference,
  VideoTrack,
  useTracks,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { colors } from '@/theme';
import { goBackOr } from '@/lib/navigation';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL ?? '';

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  return (
    <View style={{ flex: 1 }}>
      {(tracks as TrackReference[]).map((t) => (
        <VideoTrack key={t.publication.trackSid} trackRef={t} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

export default function LiveRoom() {
  const { room, publish, broadcast } = useLocalSearchParams<{ room: string; publish: string; broadcast: string }>();
  const [token, setToken] = useState<string | null>(null);
  const canPublish = publish === 'true';

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => { AudioSession.stopAudioSession(); };
  }, []);

  useEffect(() => {
    if (!room) return;
    api.getLiveKitToken(room, canPublish).then(setToken).catch((e: Error) => {
      Alert.alert('Connection Error', e.message);
      goBackOr('/tv');
    });
  }, [room, canPublish]);

  function handleDisconnect() {
    goBackOr('/tv');
  }

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff' }}>Connecting…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect
        audio={canPublish}
        video={canPublish}
        onDisconnected={handleDisconnect}
      >
        <VideoGrid />
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between', pointerEvents: 'box-none' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48 }}>
            {broadcast === 'true' && (
              <View style={{ backgroundColor: colors.danger, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>● LIVE</Text>
              </View>
            )}
            <Pressable onPress={() => Alert.alert('Report', 'Report this user?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Report', style: 'destructive', onPress: () => {} },
            ])} style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 }}>
              <Ionicons name="flag-outline" size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 24 }}>
            <Pressable style={styles.ctrl} onPress={() => {}}>
              <Ionicons name="mic" size={22} color="#fff" />
            </Pressable>
            <Pressable style={styles.ctrl} onPress={() => {}}>
              <Ionicons name="videocam" size={22} color="#fff" />
            </Pressable>
            <Pressable style={[styles.ctrl, { backgroundColor: colors.danger }]} onPress={handleDisconnect}>
              <Ionicons name="call" size={22} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          </View>
        </View>
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  ctrl: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
});
