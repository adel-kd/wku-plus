import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function GebeyaImagePicker({ uri, onChange, label = 'Choose photo' }: { uri: string | null; onChange: (uri: string) => void; label?: string }) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.82 });
    if (!result.canceled) onChange(result.assets[0].uri);
  }
  return <View style={{ gap: 8 }}>
    {uri ? <Image source={{ uri }} style={{ width: '100%', height: 180, borderRadius: radius.md }} contentFit="cover" /> : null}
    <Pressable onPress={pick} style={{ borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, padding: 13, alignItems: 'center' }}><Text style={{ color: colors.primary, fontWeight: '800' }}>{uri ? 'Change photo' : label}</Text></Pressable>
  </View>;
}
