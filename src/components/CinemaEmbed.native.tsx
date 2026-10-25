import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/theme';

interface CinemaEmbedProps {
  title: string;
  url: string;
}

export function CinemaEmbed({ title, url }: CinemaEmbedProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>The player could not load</Text>
        <Text style={styles.messageText}>Check your connection and try again.</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      style={styles.webview}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading {title}…</Text>
        </View>
      )}
      onError={() => setFailed(true)}
      onHttpError={(event) => {
        if (event.nativeEvent.statusCode >= 400) setFailed(true);
      }}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#000' },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
  },
  loadingText: { color: colors.white, fontWeight: '700' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' },
  messageTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  messageText: { color: '#AAB4C0', marginTop: 6, textAlign: 'center' },
});
