import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: user } = await db.auth.getUser();
    if (!user.user) return json({ error: 'Not signed in' }, 401);
    const { provider, reference } = await req.json();
    if (!provider || !reference) return json({ error: 'provider and reference are required' }, 400);
    const response = await fetch('https://developer-duverifay.vercel.app/api/developer/v1/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('du_secret')}`, 'Content-Type': 'application/json', 'Idempotency-Key': `merchant-${user.user.id}-${reference}` },
      body: JSON.stringify({ provider, reference, expectedAmount: 500, returnDetails: false }),
    });
    const result = await response.json();
    if (!response.ok) return json({ status: 'MANUAL_REVIEW', message: result?.message ?? 'Verification service unavailable' });
    return json({ status: result.status, message: result.message });
  } catch (e) { return json({ status: 'MANUAL_REVIEW', message: String(e) }); }
});
