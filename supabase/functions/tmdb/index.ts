import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const routes: Record<string, (body: any) => string> = {
  now: () => '/movie/now_playing',
  upcoming: () => '/movie/upcoming',
  popular: () => '/movie/popular',
  search: () => '/search/movie',
  detail: (body) => `/movie/${encodeURIComponent(String(Number(body.id)))}`,
  tvPopular: () => '/tv/popular',
  tvOnAir: () => '/tv/on_the_air',
  tvTopRated: () => '/tv/top_rated',
  tvSearch: () => '/search/tv',
  tvDetail: (body) => `/tv/${encodeURIComponent(String(Number(body.id)))}`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const secret = Deno.env.get('TMDB_API_KEY');
    if (!secret) throw new Error('TMDB_API_KEY is not configured');
    const body = await req.json();
    const route = routes[body.action];
    if (!route) return Response.json({ error: 'Unsupported TMDB action' }, { status: 400, headers: cors });
    if ((body.action === 'detail' || body.action === 'tvDetail') && (!Number.isInteger(Number(body.id)) || Number(body.id) <= 0)) {
      return Response.json({ error: 'Invalid movie id' }, { status: 400, headers: cors });
    }

    const url = new URL(`https://api.themoviedb.org/3${route(body)}`);
    url.searchParams.set('language', 'en-US');
    // TMDB currently returns only a handful of titles for the ET theatrical feed.
    // Use the global catalogue so Cinema remains useful, while keeping English metadata.
    if (body.action === 'search' || body.action === 'tvSearch') url.searchParams.set('query', String(body.query ?? '').slice(0, 100));
    if (body.action === 'detail' || body.action === 'tvDetail') url.searchParams.set('append_to_response', 'videos');

    const headers: Record<string, string> = { accept: 'application/json' };
    if (secret.startsWith('eyJ')) headers.Authorization = `Bearer ${secret}`;
    else url.searchParams.set('api_key', secret);

    const response = await fetch(url, { headers });
    const data = await response.json();
    return Response.json(data, { status: response.status, headers: { ...cors, 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'TMDB request failed' }, { status: 500, headers: cors });
  }
});
