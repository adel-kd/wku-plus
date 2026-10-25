// Supabase Edge Function: mints a LiveKit room token for the signed-in user.
// Deploy: supabase functions deploy livekit-token
// Secrets: supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://...
import { createClient } from 'npm:@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk@2';

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: cors });
    }

    const { room, canPublish } = await req.json();
    if (!room || typeof room !== 'string') {
      return new Response(JSON.stringify({ error: 'room is required' }), { status: 400, headers: cors });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userRes.user.id)
      .single();
    const identity = userRes.user.id;
    const name = profile?.full_name || profile?.phone || 'WKU Student';

    const at = new AccessToken(Deno.env.get('LIVEKIT_API_KEY')!, Deno.env.get('LIVEKIT_API_SECRET')!, {
      identity,
      name,
      ttl: '2h',
    });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: !!canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return new Response(JSON.stringify({ token, url: Deno.env.get('LIVEKIT_URL') }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
