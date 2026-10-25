import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: user } = await admin.auth.getUser();
    if (!user.user) return json({ error: 'Not signed in' }, 401);
    const { data: caller } = await admin.from('profiles').select('role').eq('id', user.user.id).single();
    if (caller?.role !== 'admin') return json({ error: 'Admins only' }, 403);

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const department = typeof body.department === 'string' ? body.department.trim() : '';
    if (!message || message.length > 160) return json({ error: 'Message must be 1-160 characters' }, 400);

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    let query = service.from('profiles').select('phone').neq('phone', '');
    if (department) query = query.ilike('department', department);
    const { data: profiles, error } = await query;
    if (error) return json({ error: error.message }, 500);
    let sent = 0, failed = 0;
    for (const profile of profiles ?? []) {
      const response = await fetch('https://smsethiopia.com/api/sms/send', { method: 'POST', headers: { KEY: Deno.env.get('SMSETHIOPIA_API_KEY')!, 'Content-Type': 'application/json' }, body: JSON.stringify({ msisdn: profile.phone.replace(/^\+/, ''), text: message }) });
      if (response.ok) sent++; else failed++;
    }
    return json({ sent, failed });
  } catch (e) { return json({ error: String(e) }, 500); }
});
