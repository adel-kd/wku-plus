import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function DashboardVideo() {
  const player = useVideoPlayer(require('../../assets/dashboard-hero.mp4'), (video) => {
    video.muted = true;
    video.loop = true;
    video.play();
  });
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') player.play();
  });
  useFocusEffect(React.useCallback(() => {
    player.play();
    return () => player.pause();
  }, [player]));
  return <View style={styles.frame}><VideoView player={player} style={styles.video} contentFit="contain" nativeControls={false} /></View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', maxWidth: 560, aspectRatio: 535 / 277, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  video: { width: '100%', height: '100%' },
});
