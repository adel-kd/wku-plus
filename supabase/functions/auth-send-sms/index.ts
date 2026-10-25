import { Webhook } from 'npm:standardwebhooks@1.0.0';

type SendSmsEvent = {
  user?: { phone?: string };
  sms?: { otp?: string };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const rawSecret = Deno.env.get('SEND_SMS_HOOK_SECRET');
    const smsApiKey = Deno.env.get('SMSETHIOPIA_API_KEY');
    if (!rawSecret || !smsApiKey) {
      console.error('Missing SEND_SMS_HOOK_SECRET or SMSETHIOPIA_API_KEY');
      return json({ error: 'SMS service is not configured' }, 500);
    }

    const payload = await req.text();
    const hookSecret = rawSecret.replace(/^v1,whsec_/, '');
    const event = new Webhook(hookSecret).verify(
      payload,
      Object.fromEntries(req.headers.entries()),
    ) as SendSmsEvent;

    const phone = event.user?.phone?.replace(/\D/g, '') ?? '';
    const otp = event.sms?.otp ?? '';
    if (!/^2519\d{8}$/.test(phone) || !/^\d{4,8}$/.test(otp)) {
      return json({ error: 'Invalid Ethiopian phone number or OTP payload' }, 400);
    }

    const response = await fetch('https://smsethiopia.com/api/sms/send', {
      method: 'POST',
      headers: {
        KEY: smsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msisdn: phone,
        text: `${otp} is your WKU+ verification code. It expires soon. Do not share it.`,
      }),
    });

    const providerBody = await response.text();
    if (!response.ok) {
      console.error('SMSEthiopia rejected OTP delivery', response.status, providerBody);
      return json({ error: 'Could not send verification code' }, 502);
    }

    return json({});
  } catch (error) {
    console.error('Send SMS hook failed', error);
    return json({ error: 'Could not send verification code' }, 500);
  }
});
