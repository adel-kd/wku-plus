import { Redirect } from 'expo-router';
import React from 'react';
import { Image, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function Index() {
  const { loading, profile } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sky }}>
        <Image source={require('../../assets/logo.png')} resizeMode="contain" style={{ width: 88, height: 56 }} />
      </View>
    );
  }
  if (!profile) return <Redirect href="/auth/phone" />;
  if (!profile.fullName) return <Redirect href="/auth/setup" />;
  return <Redirect href="/(tabs)" />;
}
