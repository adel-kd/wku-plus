import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Button, Screen } from '@/components/ui';
import { backdropUrl, movieDetail, posterUrl, seriesDetail, TmdbMovie } from '@/lib/tmdb';
import { colors, radius } from '@/theme';

export default function MovieDetail() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const [movie, setMovie] = useState<TmdbMovie | null>(null);

  useEffect(() => {
    setMovie(null);
    if (id) (type === 'tv' ? seriesDetail(Number(id)) : movieDetail(Number(id))).then(setMovie);
  }, [id, type]);

  if (!movie) return (
    <Screen>
      <PageHeader title="Movie" />
      <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
    </Screen>
  );

  const genres = (movie.genres ?? []).join(' · ');

  return (
    <Screen>
      <PageHeader title={movie.title} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ height: 200, backgroundColor: colors.deep }}>
          {backdropUrl(movie.backdropPath) && (
            <Image source={{ uri: backdropUrl(movie.backdropPath)! }} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </View>
        <View style={{ flexDirection: 'row', padding: 16, gap: 14, marginTop: -40 }}>
          <Image
            source={posterUrl(movie.posterPath) ? { uri: posterUrl(movie.posterPath)! } : undefined}
            style={{ width: 90, height: 135, borderRadius: radius.md, borderWidth: 2, borderColor: colors.white }}
            contentFit="cover"
          />
          <View style={{ flex: 1, paddingTop: 44, gap: 4 }}>
            <Text style={{ fontWeight: '800', color: colors.ink, fontSize: 16, lineHeight: 20 }}>{movie.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{movie.releaseDate?.slice(0, 4)}</Text>
            {genres ? <Text style={{ color: colors.muted, fontSize: 11 }}>{genres}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="star" size={13} color="#F5C518" />
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{movie.voteAverage?.toFixed(1)}</Text>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Text style={{ color: colors.ink, lineHeight: 22 }}>{movie.overview}</Text>
          <Button
            label="Play inside WKU+"
            onPress={() => router.push({
              pathname: '/cinema/watch',
              params: { id: String(movie.id), type: movie.mediaType ?? type ?? 'movie', title: movie.title },
            })}
          />
          {movie.trailerKey ? (
            <Button variant="secondary" label="Watch official trailer" onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${movie.trailerKey}`)} />
          ) : null}
          {movie.mediaType === 'tv' && movie.seasons?.length ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800' }}>Seasons</Text>
              {movie.seasons.map(season => (
                <View key={season.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10 }}>
                  {season.posterPath ? <Image source={{ uri: posterUrl(season.posterPath)! }} style={{ width: 48, height: 70, borderRadius: 8 }} contentFit="cover" /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>{season.name}</Text>
                    <Text style={{ color: colors.muted, marginTop: 3 }}>{season.episodeCount} episodes</Text>
                  </View>
                  <Button
                    label="Play"
                    onPress={() => router.push({
                      pathname: '/cinema/watch',
                      params: {
                        id: String(movie.id),
                        type: 'tv',
                        title: `${movie.title} — ${season.name}`,
                        season: String(season.seasonNumber),
                        episode: '1',
                      },
                    })}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
