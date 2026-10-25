import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: user } = await db.auth.getUser(); if (!user.user) return json({ error: 'Not signed in' }, 401);
    const input = await req.json();
    const prompt = `Review this campus marketplace listing for prohibited, dangerous, illegal, adult, hateful, or deceptive content. Return JSON only: {"approved":true|false,"reason":"short reason"}. Title: ${input.title}\nDescription: ${input.description}\nCondition: ${input.condition}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }) });
    if (!response.ok) return json({ approved: false, reason: 'Automatic review unavailable; admin review required.' });
    const body = await response.json(); const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'; return json(JSON.parse(text));
  } catch { return json({ approved: false, reason: 'Automatic review failed; admin review required.' }); }
});
