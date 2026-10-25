import { Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/theme';
import { IntroVideo } from '@/components/IntroVideo';
import { PushRegistration } from '@/components/PushRegistration';

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushRegistration />
        <StatusBar style="dark" />
        {showIntro ? <IntroVideo onFinish={finishIntro} /> : <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
