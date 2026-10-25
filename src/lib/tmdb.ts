import { supabase } from './supabaseClient';

const IMG = 'https://image.tmdb.org/t/p';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genres?: string[];
  mediaType?: 'movie' | 'tv';
  seasons?: { id: number; name: string; seasonNumber: number; episodeCount: number; posterPath: string | null }[];
  trailerKey?: string;
}

export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w342') {
  return path ? `${IMG}/${size}${path}` : null;
}
export function backdropUrl(path: string | null, size: 'w780' | 'original' = 'w780') {
  return path ? `${IMG}/${size}${path}` : null;
}

function map(m: any, mediaType: 'movie' | 'tv' = 'movie'): TmdbMovie {
  const trailer = m.videos?.results?.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official)
    ?? m.videos?.results?.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer');
  return {
    id: m.id,
    title: m.title ?? m.name,
    overview: m.overview ?? '',
    posterPath: m.poster_path ?? null,
    backdropPath: m.backdrop_path ?? null,
    releaseDate: m.release_date ?? m.first_air_date ?? '',
    voteAverage: m.vote_average ?? 0,
    genres: m.genres?.map((g: any) => g.name),
    mediaType,
    seasons: m.seasons?.filter((season: any) => season.season_number > 0).map((season: any) => ({
      id: season.id,
      name: season.name,
      seasonNumber: season.season_number,
      episodeCount: season.episode_count,
      posterPath: season.poster_path ?? null,
    })),
    trailerKey: trailer?.key,
  };
}

async function get(action: string, extra: Record<string, string | number> = {}) {
  const { data, error } = await supabase.functions.invoke('tmdb', { body: { action, ...extra } });
  if (error) throw new Error(error.message || 'Movie service is unavailable');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function nowPlaying(): Promise<TmdbMovie[]> {
  const data = await get('now');
  return (data.results ?? []).map(map);
}
export async function upcoming(): Promise<TmdbMovie[]> {
  const data = await get('upcoming');
  return (data.results ?? []).map(map);
}
export async function popular(): Promise<TmdbMovie[]> {
  const data = await get('popular');
  return (data.results ?? []).map(map);
}
export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  if (!query.trim()) return [];
  const data = await get('search', { query });
  return (data.results ?? []).map(map);
}
export async function movieDetail(id: number): Promise<TmdbMovie> {
  const data = await get('detail', { id });
  return map(data);
}
export async function popularSeries(): Promise<TmdbMovie[]> {
  const data = await get('tvPopular');
  return (data.results ?? []).map((item: any) => map(item, 'tv'));
}
export async function onAirSeries(): Promise<TmdbMovie[]> {
  const data = await get('tvOnAir');
  return (data.results ?? []).map((item: any) => map(item, 'tv'));
}
export async function topRatedSeries(): Promise<TmdbMovie[]> {
  const data = await get('tvTopRated');
  return (data.results ?? []).map((item: any) => map(item, 'tv'));
}
export async function searchSeries(query: string): Promise<TmdbMovie[]> {
  if (!query.trim()) return [];
  const data = await get('tvSearch', { query });
  return (data.results ?? []).map((item: any) => map(item, 'tv'));
}
export async function seriesDetail(id: number): Promise<TmdbMovie> {
  const data = await get('tvDetail', { id });
  return map(data, 'tv');
}
