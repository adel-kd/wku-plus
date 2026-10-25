import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Chip, Screen } from '@/components/ui';
import { nowPlaying, onAirSeries, popular, popularSeries, posterUrl, searchMovies, searchSeries, TmdbMovie, topRatedSeries, upcoming } from '@/lib/tmdb';
import { colors, radius } from '@/theme';

type Tab = 'now' | 'upcoming' | 'popular';
type Media = 'movies' | 'series';

export default function CinemaIndex() {
  const [tab, setTab] = useState<Tab>('now');
  const [media, setMedia] = useState<Media>('movies');
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let on = true;
    setLoading(true);
    setError('');
    const fetch = media === 'movies'
      ? (tab === 'now' ? nowPlaying() : tab === 'upcoming' ? upcoming() : popular())
      : (tab === 'now' ? onAirSeries() : tab === 'upcoming' ? topRatedSeries() : popularSeries());
    fetch.then(r => { if (on) { setMovies(r); setLoading(false); } }).catch((e: Error) => { if (on) { setError(e.message); setLoading(false); } });
    return () => { on = false; };
  }, [tab, media]));

  async function doSearch(q: string) {
    setQuery(q);
    if (!q.trim()) { setLoading(true); (media === 'movies' ? nowPlaying() : onAirSeries()).then(r => { setMovies(r); setLoading(false); }); return; }
    setLoading(true);
    setError('');
    try { const r = await (media === 'movies' ? searchMovies(q) : searchSeries(q)); setMovies(r); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load titles'); } finally { setLoading(false); }
  }

  return (
    <Screen>
      <PageHeader title="WKU Cinema" subtitle="Movies, series and official trailers" />
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 14 }}>
        <Chip label="Movies" active={media === 'movies'} onPress={() => { setMedia('movies'); setQuery(''); }} />
        <Chip label="Series" active={media === 'series'} onPress={() => { setMedia('series'); setQuery(''); }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 14, backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, gap: 8 }}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={doSearch}
          placeholder={`Search ${media}…`}
          placeholderTextColor={colors.muted}
          style={{ flex: 1, height: 40, color: colors.ink }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => doSearch('')}><Ionicons name="close-circle" size={16} color={colors.muted} /></Pressable>
        )}
      </View>
      {!query && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginBottom: 8 }}>
          <Chip label={media === 'movies' ? 'Now Playing' : 'On Air'} active={tab === 'now'} onPress={() => setTab('now')} />
          <Chip label={media === 'movies' ? 'Upcoming' : 'Top Rated'} active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
          <Chip label="Popular" active={tab === 'popular'} onPress={() => setTab('popular')} />
        </View>
      )}
      {!loading && !error && <Text style={{ color: colors.muted, fontSize: 11, paddingHorizontal: 14, marginBottom: 8 }}>{movies.length} live TMDB results</Text>}
      {error ? <View style={{ margin: 14, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}><Ionicons name="cloud-offline-outline" size={28} color={colors.muted} /><Text style={{ color: colors.ink, fontWeight: '800', marginTop: 8 }}>Movies could not load</Text><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>{error}</Text></View> : null}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : !error ? (
        <FlatList
          data={movies}
          keyExtractor={m => String(m.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 14 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/cinema/[id]', params: { id: String(item.id), type: media === 'series' ? 'tv' : 'movie' } })}
              style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
            >
              <Image
                source={posterUrl(item.posterPath) ? { uri: posterUrl(item.posterPath)! } : undefined}
                style={{ width: '100%', height: 160 }}
                contentFit="cover"
              />
              <View style={{ padding: 8, gap: 4 }}>
                <Text numberOfLines={2} style={{ fontWeight: '700', color: colors.ink, fontSize: 12, lineHeight: 16 }}>{item.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={11} color="#F5C518" />
                  <Text style={{ color: colors.muted, fontSize: 11 }}>{item.voteAverage?.toFixed(1)}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : null}
    </Screen>
  );
}
