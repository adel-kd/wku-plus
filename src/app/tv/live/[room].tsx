import { Ionicons } from '@expo/vector-icons';
import React, { Suspense } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import { goBackOr } from '@/lib/navigation';

const NativeLiveRoom = React.lazy(() => import('@/components/LiveRoomNative'));

export default function LiveRoom() {
  if (Platform.OS !== 'web') {
    return (
      <Suspense fallback={<View style={styles.nativeLoading}><Text style={styles.nativeLoadingText}>Connecting…</Text></View>}>
        <NativeLiveRoom />
      </Suspense>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait-outline" size={56} color={colors.primary} />
      <Text style={styles.title}>Open this live room on mobile</Text>
      <Text style={styles.message}>
        Live video uses the native WKU+ calling experience and is currently available on Android and iOS.
      </Text>
      <Pressable style={styles.button} onPress={() => goBackOr('/tv')}>
        <Text style={styles.buttonText}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  nativeLoadingText: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    padding: 24,
  },
  title: {
    marginTop: 18,
    color: '#162033',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    maxWidth: 460,
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
