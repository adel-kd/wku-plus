import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const finish = useCallback(onFinish, [onFinish]);
  const player = useVideoPlayer(require('../../assets/intro.mp4'), (instance) => {
    instance.muted = true;
    instance.loop = false;
    instance.play();
  });

  useEventListener(player, 'playToEnd', finish);
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') finish();
    if (status === 'readyToPlay') player.play();
  });

  useEffect(() => {
    const fallback = setTimeout(finish, 5000);
    return () => clearTimeout(fallback);
  }, [finish]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
});
