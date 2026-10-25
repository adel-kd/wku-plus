import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CinemaEmbedProps {
  title: string;
  url: string;
}

export function CinemaEmbed({ title, url }: CinemaEmbedProps) {
  return (
    <View style={styles.container}>
      {React.createElement('iframe', {
        src: url,
        title: `${title} cinema player`,
        allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media',
        allowFullScreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        style: { width: '100%', height: '100%', border: 0, backgroundColor: '#000' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
