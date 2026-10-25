import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = req.headers.get('Authorization') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403, headers: cors });

    const { title, message, department } = await req.json();
    if (!String(title ?? '').trim() || !String(message ?? '').trim()) return Response.json({ error: 'Title and message are required' }, { status: 400, headers: cors });
    let ids: string[] | null = null;
    if (String(department ?? '').trim()) {
      const { data: users } = await admin.from('profiles').select('id').ilike('department', String(department).trim());
      ids = (users ?? []).map((row) => row.id);
    }
    let query = admin.from('push_tokens').select('token');
    if (ids) query = query.in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const { data: rows, error } = await query;
    if (error) throw error;
    const messages = (rows ?? []).map(({ token }) => ({ to: token, title: String(title).slice(0, 100), body: String(message).slice(0, 500), sound: 'default', data: { url: '/' } }));
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages.slice(i, i + 100)) });
      if (!response.ok) throw new Error(`Push provider returned ${response.status}`);
      sent += messages.slice(i, i + 100).length;
    }
    return Response.json({ sent }, { headers: cors });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Push failed' }, { status: 500, headers: cors });
  }
});
