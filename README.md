# WKU+ — The Ultimate Wolkite University Super-App

A single Expo React Native app covering all of campus life:
**🗺 Campus Tour · 🍔 Delivery · 🛍 Gebeya · 📽 Cinema · 📺 WKU TV · 💡 Student Tips**

---

## Quick Start (Sample / Offline Mode)

No Supabase needed. Just run without `.env` set and the app uses in-memory mock data.

```bash
npm install --legacy-peer-deps
npx expo start --dev-client        # scan QR with Expo Go or a dev build
```

**Mock test accounts** (OTP code is always `123456`):

| Phone | Role |
|---|---|
| +251900000001 | Admin |
| +251900000002 | Merchant |
| +251900000003 | Runner |
| Any other number | Student (new account) |

---

## Production Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (already done: `wku+`).
2. Run the schema:
   - Open **SQL Editor** in the Supabase dashboard.
   - Paste and run the contents of `supabase/schema.sql`.
3. Enable **Phone Auth** under Authentication → Providers → Phone (choose Twilio or Africa's Talking for Ethiopian numbers).

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=<your Supabase project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
EXPO_PUBLIC_TMDB_KEY=<your TMDB key, if used directly>
EXPO_PUBLIC_LIVEKIT_URL=<your LiveKit websocket URL>
```

### 3. LiveKit Edge Function Secrets

The LiveKit API secret **must never be in the app** — it lives only in the Supabase Edge Function.

Go to: **Supabase Dashboard → Edge Functions → livekit-token → Secrets**

Add:
```
LIVEKIT_API_KEY     = <your LiveKit API key>
LIVEKIT_API_SECRET  = <your LiveKit API secret>
LIVEKIT_URL         = <your LiveKit websocket URL>
```

The edge function is already deployed. No CLI needed.

### 4. Build

Development build (required for LiveKit, Location, WebView):
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

---

## Architecture

```
src/
  app/           Expo Router screens (file-based routing)
    (tabs)/      Bottom tab bar: Home · Orders · Profile
    auth/        Phone OTP login flow
    tour/        Campus map with category filters
    delivery/    Order food → track runner live
    gebeya/      Buy/sell: merchant shop + used marketplace
    cinema/       TMDB movie browser (watch → "Coming soon")
    tv/          WKU TV: random 1-on-1 chat + Go Live
    tips/         Scholarships, internships, study resources
    admin/       Full admin console (vendors, menus, users, orders)
    merchant/    Merchant shop management + apply flow
  components/    Shared UI: LeafletMap, PageHeader, ui.tsx
  data/          places.ts (85 campus locations) + categories.ts
  lib/
    api/         Mock + Supabase backends behind a single Api interface
    auth.tsx     AuthProvider / useAuth() context
    geo.ts       Haversine distance, compass, walking time
    tmdb.ts      TMDB movie client
    types.ts     All domain types
    useLocation  Live GPS hook
  theme/         Colors, radius, shadow tokens
supabase/
  schema.sql     Full Postgres schema with RLS, triggers, functions
  functions/     Deno edge functions (livekit-token)
assets/          Logo, app icons, splash, tile images
```

### Role System

Roles live **only in the database** (`profiles.role`). There is no role picker in the UI.
A Postgres trigger (`protect_role`) blocks any non-admin from changing their own role —
this closes the privilege-escalation bug that prompted the rebuild.

| Role | Can do |
|---|---|
| student | Order delivery, buy/sell used item (1/week), browse everything |
| merchant | Everything student + run a shop and sell new products |
| runner | Accept and deliver orders |
| admin | Everything + manage vendors/menus/users/applications |

---

## Key Design Decisions

- **No API key for maps** — Leaflet + OpenStreetMap tiles inside a WebView. Works offline.
- **Secrets never in the app** — LiveKit API secret and TMDB read token live server-side only.
- **Belt-and-suspenders weekly limit** — Postgres trigger enforces 1 used item/week even if the client is bypassed.
- **Atomic order acceptance** — `SKIP LOCKED` in `accept_order()` prevents two runners claiming the same order.
- **Cinema "Coming Soon"** — TMDB browsing works fully; any attempt to watch shows a modal with "Coming soon" message.
