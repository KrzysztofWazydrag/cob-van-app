# Cob Van App

Expo app for iOS, Android, and web with Supabase email/password authentication and a local product prototype.

## What is included

- Customer home with tappable live ETA tracking, ready van stock, menu categories, and low-stock prompts
- Product customisation with sauce, quantity, and `Reserve mine`
- Build-your-own cob, baguette, or wrap with live filling prices and a clear order summary
- Working Home, In the Van, Orders, and Profile customer tabs
- One distinct local food photo for every menu item
- New reservations appear immediately in the current-stop driver order list
- Van crew order flow: ready van stock goes straight to `Ready → Collected`; made-to-order food uses `Reserved → Preparing → Ready → Collected`
- Each order shows customer, number, item, quantity, options, price, and status
- Van crew view with next stop, arrival action, order list, and stock split
- Reserved vs walk-in stock visibility to reduce waste
- One-tap walk-up sales and collection both keep physical/reserved stock accurate
- Expo Go-compatible OpenStreetMap tracking view with a moving van marker
- Local arrival notification when the driver starts Stop Mode

Tap the **JP** avatar to open the van crew view, and **CV** to return to the customer view.

## Run locally

```bash
npm install
cp .env.example .env
# Fill in the public Supabase URL and anon key (see below).
npm start
```

Then scan the QR code with Expo Go, or press `w` for the browser preview.

Useful alternatives:

```bash
npm run android
npm run ios
npm run web
```

## Current scope

Authentication uses Supabase; product data remains realistic local mock data. Menu, orders, stock, workplace selection, map movement and service time remain local/simulated. Map tiles require an internet connection. Real GPS, remote push delivery and app-data persistence are deferred. The JP/CV switch is a prototype preview control, not backend authorization; it remains available to every authenticated user. Signing out unmounts and resets the local prototype.

Remote push notifications and background driver location require an Expo development build. Expo Go supports the prototype's map and order flow; notification integration is skipped there so the app can run without the unsupported Android push module.


## Supabase foundation setup

1. Create a development Supabase project. Keep email/password authentication enabled.
2. Apply `supabase/migrations/20260909000100_auth_foundation.sql` once using the Supabase SQL Editor. The migration is transactional. If using the Supabase CLI, initialize/link the project and apply it with `supabase db push` instead; do not apply it twice.
3. Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`: your project URL (`SUPABASE_URL`).
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: your public anon key (`SUPABASE_ANON_KEY`).
4. Restart Expo after changing environment variables; deployed builds must be rebuilt. Expo requires the `EXPO_PUBLIC_` prefix to bundle client environment variables. These values are public app configuration; never use a service-role or secret key. Local env files are gitignored.

Without configuration the app displays a setup message. There is no authentication bypass or hardcoded credential.

If email confirmation is enabled, signup shows a message to confirm the email and then return to sign in with a password. Configure an appropriate reachable Site URL in Supabase Auth URL Configuration for the confirmation landing page. This foundation does not exchange callback URLs for sessions or implement magic links. Alternatively, confirmation may be disabled in a development project for immediate signup sessions.

### Session behavior

`src/lib/supabase.ts` follows the [Supabase React Native auth pattern](https://supabase.com/docs/guides/auth/quickstarts/react-native): AsyncStorage on native, browser localStorage on web, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, and `processLock` on native. Supabase owns storage, token refresh and session invalidation. No password or separate custom session cache is saved by the app.

`AuthGate` waits for `getSession()` / auth events before rendering. A restored session opens the prototype directly. Native AppState starts refresh while active and stops it in the background; subscriptions are cleaned up on unmount. Expired access tokens are refreshed with the persisted refresh token by Supabase. An invalid refresh session returns to authentication. Transient errors do not trigger a custom forced logout. Session lifetime/revocation settings remain controlled by Supabase.

The accessible **Log out** button calls `supabase.auth.signOut({ scope: 'local' })` to clear this device's session without logging out other devices. Supabase's sign-out event returns to authentication. Failed logout is shown with a retryable button rather than falsely claiming the session was cleared.

### Schema and profile security

- `profiles`: auth user UUID primary key, display name, customer/owner/driver role, nullable workplace and van foreign keys, creation timestamp.
- `vans`: UUID primary key, required owner profile, name, creation timestamp.
- `workplaces`: UUID primary key, required van, name, unique invite code, active flag, creation timestamp.
- An auth-user insert trigger creates the profile atomically, even when signup requires confirmation. Existing auth users are backfilled. Role is always `customer` regardless of signup metadata. This follows Supabase's [profile trigger guidance](https://supabase.com/docs/guides/auth/managing-user-data).
- All three tables have RLS. Authenticated users can select their own profile and update only `display_name`. Column grants prevent changing roles/membership/IDs/timestamps. Anonymous users have no access. Vans/workplaces have no client grants or policies yet.
- Owner/driver assignment, vans and workplaces are managed manually in the development dashboard/SQL Editor. Invite-code creation and membership are intentionally not implemented. Owner references prevent deleting a profile that still owns a van; reassign the van before deleting its owner.

## Validation

```bash
npm test
npm run typecheck
npm run export:web
npx expo-doctor
```

Automated tests cover auth gating, restoration, invalidation events, logout and failure handling, signup confirmation and metadata, and the App's customer/driver routing with stubbed screens. A real Supabase client is tested with a simulated HTTP server response and AsyncStorage adapter for persistence across client recreation, expired-token refresh and logout clearing. The migration is executed in PGlite (embedded PostgreSQL) with a minimal Supabase auth schema to check profile creation/backfill, forced customer role, own-profile RLS, field restrictions, anonymous denial and auth-user deletion.

Validation on 2026-09-09: all 10 tests, TypeScript, web export and iOS/Android bundle exports passed. Expo Doctor passed 20/21 checks; its only failure is the pre-existing Expo patch mismatch (`57.0.20` installed, `~57.0.21` expected). That unrelated upgrade is deferred.

Live Supabase verification on 2026-09-09 passed in the configured web build:

- Email/password signup created an unconfirmed auth user and displayed the confirmation instruction.
- The database trigger created the matching profile immediately with display name `Cob Van Live Test`, role `customer`, and null workplace/van memberships.
- Email confirmation populated `email_confirmed_at`, and password sign-in opened the existing customer prototype.
- Reloading, then closing and reopening the app tab restored the session without requesting credentials.
- Logout returned to authentication. Closing and reopening after logout still showed authentication with empty credential fields.

Native acceptance remains to be completed on physical iOS and Android devices. Force-close and reopen without clearing app storage to verify AsyncStorage restoration, repeat after access-token expiry to exercise refresh, then log out and reopen to verify credentials are required. Also test a revoked/invalid refresh session after access-token expiry; ordinary access-token expiry should refresh without prompting for credentials.

Next backend step: define and enforce profile-to-van/workplace membership and tenant policies before migrating a small read-only menu slice. Orders, stock, realtime, GPS, push, payments, analytics, workplace onboarding, invite UI and admin dashboards remain out of scope.
