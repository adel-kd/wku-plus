import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { CinemaEmbed } from '@/components/CinemaEmbed';
import { PageHeader } from '@/components/PageHeader';

const CINEMA_ORIGIN = 'https://cinextma.vercel.app';

export default function CinemaWatch() {
  const { id, type, title, season, episode } = useLocalSearchParams<{
    id: string;
    type?: string;
    title?: string;
    season?: string;
    episode?: string;
  }>();

  const numericId = Number(id);
  const safeId = Number.isFinite(numericId) && numericId > 0 ? Math.floor(numericId) : 0;
  const safeSeason = Math.max(1, Number(season) || 1);
  const safeEpisode = Math.max(1, Number(episode) || 1);
  const url = type === 'tv'
    ? `${CINEMA_ORIGIN}/tv/${safeId}/${safeSeason}/${safeEpisode}/player`
    : `${CINEMA_ORIGIN}/movie/${safeId}/player`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <PageHeader title={title || 'Cinema player'} />
      <CinemaEmbed title={title || 'Cinema'} url={url} />
    </View>
  );
}
