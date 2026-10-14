# Aligning the websites with the app (shell + all existing institute sites)

Goal: one look and one set of tokens across the COV app and every institute website, so a member sees the
same product in the app and in a phone browser, and a new institute needs no design work.

Reference design: Claude Design canvas https://claude.ai/artifact/AHhagGh92JwwrGPXdDaknb (private; open from the owner's
account) and `docs/DESIGN.md` in this repo. Reference institute: AIIMS Delhi (`ritanya-sanstha/cov-aiims-delhi`).
Facts below about the shell were read from that repo (Next.js with `proxy.ts`, Tailwind 4 `@theme`, `components/Navbar.tsx`,
`app/(main)/layout.tsx`, `contexts/AuthContext.tsx`, `components/AuthGuard.tsx`, `app/globals.css`). Where a detail could not
be read it says "adapt".

## 0. How to use this document
Do the work first in the shell/reference repo (AIIMS Delhi), on its `staging` branch (the deploy workflow sends `staging`
to `cov-aiims-delhi-staging`), test it with the app (section 7), then roll it to the other institutes (section 6).
A prompt you can give to a Claude session opened on the website repo:

> Read `docs/WEB_ALIGNMENT.md` from https://github.com/ritanya-sanstha/cov-aiims-delhi-app (branch
> `claude/android-apk-build-failures-g3k77r` until merged). Implement sections 2, 3 and 4 in this repo on a new branch
> from `staging`. Do not change page content or behaviour for normal browsers except where section 3 says so. Run `bunx tsc --noEmit`
> and the tests folder by folder as in `.agents/docs/new-institute-playbook.md` section 7.

## 1. The shared design, in one table
| Token | Web (`app/globals.css`) | App (register / `src/theme.ts`) | AIIMS Delhi |
|---|---|---|---|
| Primary | `--primary` | `branding.primaryColor` | #2E4D23 |
| Highlight | `--brand-gold` | `branding.accentColor` | #F9BF1F |
| Secondary | `--brand-blue` | `branding.secondaryColor` | #2E7BA3 |
| Alert | `--brand-accent` | `branding.alertColor` | #B54321 |
| Heading font | `--font-heading` Plus Jakarta Sans | `fonts.title` | same |
| Body font | `--font-sans` Geist | `fonts.regular` | same |
| App ground (new) | `--app-ground` | `colors.ground` | #F2F3F7 |
| Card radius | 20px | `radius.card` | 20px |
| Touch target | 44px minimum | 44px | |

The web already uses the same palette variables and fonts, so most of the alignment is layout, not colour.
Make the web the **source of truth for colours**: the app should read them from the website (section 4.3) instead of being
typed in twice.

## 2. App mode: the website knows it is inside the app
The app sends the user-agent token `COVApp/<version>` on every request, sets `<html data-app="android" class="in-app">`
and `window.__IN_APP` after load (contract: `docs/WEBSITE_APP_MODE.md`). Use the token on the **server** so the first paint is right.

### 2.1 Detect it (root layout, `app/layout.tsx`)
Next.js 16: `headers()` is async. The layout is already dynamic (it reads the session cookie), so this costs nothing.
```tsx
import { headers } from "next/headers";
// ...
const ua = (await headers()).get("user-agent") ?? "";
const isApp = /COVApp\/[\d.]+/.test(ua);
// on the <html> element (it already has suppressHydrationWarning):
<html lang="en" suppressHydrationWarning {...(isApp ? { "data-app": "android", className: "in-app" } : {})}>
```
Pass `isApp` down through `Providers` (new `AppModeContext`, `useIsApp()`), so client components can branch.
Testing without the app: set the browser user agent to `... COVApp/1.0.0` (Chrome devtools > Network conditions).

### 2.2 Mark the chrome so CSS can hide it (fast path, ship this first)
Add one class each, no behaviour change:
- `components/Navbar.tsx`: the `motion.nav` gets `site-header`; the mobile bottom nav `motion.div` gets `site-bottom-nav`;
  the More overlay gets `site-bottom-nav` too (it is opened from the bottom nav).
- `components/Footer.tsx` root element: `site-footer`.
- The green share bubble component (find with `grep -rn "Share2\|share" components`): `site-fab`. Decision pending from the owner
  whether it should exist in the app at all.

Then in `app/globals.css`:
```css
:root { --header-offset: 6rem; --sticky-offset: 4rem; }            /* room for the floating navbar */
@media (min-width: 768px) { :root { --header-offset: 8rem; } }
html[data-app] { --header-offset: 0.75rem; --sticky-offset: 0px; } /* the app draws its own top bar */
html[data-app] body { background: var(--app-ground); }
html[data-app] .site-header,
html[data-app] .site-bottom-nav,
html[data-app] .site-footer,
html[data-app] .site-fab { display: none !important; }
:root { --app-ground: #F2F3F7; }
```
With this in place the app's script (`src/siteScripts.ts`) finds nothing to hide and becomes a harmless fallback.

### 2.3 Replace hard-coded header spacing with the variables
The pages reserve room for the floating navbar with fixed classes. Find them:
```
grep -rnE "pt-(24|28|32)|md:pt-(28|32|36)|top-(16|20|24|28|32)\b" app components --include=*.tsx
```
Known cases from the reference repo: `components/Hero.tsx` (`pt-24 ... md:pt-32`), `app/(main)/privacy-policy/page.tsx`
(`sticky top-32`, `scroll-mt-36`), `app/(main)/sundaysessions/[id]/page.tsx` (`sticky top-24`),
`components/community/matrimonial/MatrimonialProfileDetailClient.tsx` (`sticky top-16`), `components/JobsPortalClient.tsx` (`scroll-mt-28`).
Rules:
- top padding that exists only to clear the navbar: `pt-24 md:pt-32` becomes `pt-[var(--header-offset)]`.
- sticky bars pinned under the navbar: `top-16` becomes `top-[var(--sticky-offset)]` (and `top-24`/`top-32` become
  `top-[calc(var(--sticky-offset)+1rem)]`).
- anchor offsets: `scroll-mt-28` becomes `scroll-mt-[calc(var(--header-offset)+1rem)]`.
Do not touch padding that is real page spacing. Review each file; the grep is a candidate list, not a replace-all.
Admin pages (`app/admin/**`) keep their own layout and header; do not hide anything there.

### 2.4 App home and login (separate pages in app mode)
- `/` in app mode, signed in: render a member dashboard instead of the marketing hero (design: Home board): next learning
  session (reuse `nextSession` from the home page), quick actions (Helpline, Directory, Jobs, Mentors), unread alerts, then the
  existing announcements ticker. Signed out: redirect to `/login`. Implement as `app/(main)/page.tsx` choosing
  `isApp ? <AppHome/> : <Hero ... />`. Keep the marketing home for browsers.
- `/login` in app mode: centered logo card as in the Login board, no navbar (hidden by 2.2), same fields and logic.
- Keep these routes unchanged for browsers.

### 2.5 What else to hide or keep in app mode
Hide: floating header, bottom nav, More overlay, footer, share bubble. Keep: toasts (`Toaster`), the unverified overlay,
modals, admin layout. Cookie/consent banners, if any, can stay.

## 3. Align the web mobile look with the design (benefits Safari/Chrome users too)
The web mobile chrome is already a floating card header and a floating pill bottom bar. Make them match the design exactly:
1. Ground: `--app-ground` (#F2F3F7) behind white cards on mobile pages that use cards.
2. Cards: `rounded-[20px]`, shadow `0 2px 8px rgba(0,0,0,.06)`; bars `0 3px 10px rgba(0,0,0,.08)`.
3. Bottom nav tab label: 10px, bold, uppercase, 0.2px tracking (already close); active dot under the icon (exists).
4. Touch targets: 44px minimum for buttons and list rows; filter chips 40px.
5. The More overlay: change the list to a 3-column tile grid for the secondary links (design: More board), keep the personal hub header.
6. Title text: institute short name in bold, "Community of Volunteers" as a small line under it in the header on mobile
   (the header currently prints the full "COV – <Institute>" which wraps on phones).
Token and component list: Tokens board in the canvas.

## 4. Data the app needs from the website
The app currently scrapes the hidden header for the member's photo, initials and admin link. Replace that with real endpoints.
All read-only, same session cookie, same-origin; add under `app/api/app/v1/`.

### 4.1 `GET /api/app/v1/me`
```ts
// app/api/app/v1/me/route.ts  (adapt names to the repo's helpers)
import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/actions/auth";
import { getCurrentUserFields } from "@/lib/auth/user";

export async function GET() {
  const s = await getSessionUser();
  if (!s) return NextResponse.json({ signedIn: false }, { status: 401 });
  const f = await getCurrentUserFields(["name", "profileImage", "role", "status"]);
  const name = f?.name ?? "";
  return NextResponse.json({
    signedIn: true,
    name,
    initials: name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join(""),
    profileImage: f?.profileImage ?? "",       // the same URL UserAvatar uses (adapt: it may go through /api/image-proxy)
    isAdmin: ["Admin", "Super Admin", "Core Volunteer"].includes(String(f?.role)),
    unread: 0,                                  // adapt: call the same query getUnreadCountAction uses
  }, { headers: { "Cache-Control": "private, no-store" } });
}
```
Admin roles are taken from `components/Navbar.tsx`; re-check them against `models/user.ts`.

### 4.2 Session probe
The app currently fetches `/profile` to learn if the member is signed in. `GET /api/app/v1/me` replaces it
(401 = signed out). Tell the app owner when it exists; the app change is small.

### 4.3 `GET /app-brand.json` (public, cacheable)
So the app's palette cannot drift from the website:
```json
{ "shortName": "AIIMS Delhi", "name": "COV – AIIMS Delhi", "programName": "Community of Volunteers",
  "communityCode": "AD", "url": "https://aiimsdelhi.ritanyasanstha.in",
  "colors": { "primary": "#2E4D23", "highlight": "#F9BF1F", "secondary": "#2E7BA3", "alert": "#B54321" },
  "logo": "/logo-mark.png" }
```
Build it from `SITE` in `lib/siteConfig.ts` plus a `BRAND` object (new) holding the four colours. CSS cannot import TS, so keep the
same four values in `app/globals.css` and add a unit test that parses `globals.css` and fails if `--primary`, `--brand-gold`,
`--brand-blue`, `--brand-accent` differ from `BRAND`. `apply-institute.py` must write `BRAND` as well (add the four colours to its
inputs and to the MANUAL CHECKLIST: palette).

### 4.4 Later (native screens)
Directory, Jobs, Helpline and Alerts lists as JSON (`/api/app/v1/alumni`, `/jobs`, `/requests`, `/notifications`) reusing the
queries the pages already run. Specs per endpoint will be written screen by screen; start with Alerts, then Directory.

## 5. Shell and playbook changes
In the shell repo (the one the apply-institute script clones from):
1. Commit sections 2, 3 and 4 there (they are institute-neutral).
2. `scripts/apply-institute.py`: add `--primary --highlight --secondary --alert` (and write `BRAND`, `globals.css` variables).
3. `.agents/docs/new-institute-playbook.md`: add "8. App mode": run the test list in section 7 below, and add the register file for the app.
4. Add `.agents/docs/app-mode.md` (copy of sections 2 and 4 of this file) so every future session knows the rules.

## 6. Rolling out to the existing institute sites
Each existing site was created from an older shell and has diverged, so do not copy files over blindly.
Per institute `cov-<inst>`, on a branch from its `staging`:
1. Add the shell repo as a git remote and cherry-pick the alignment commits, or apply the same diff by hand.
2. Files that are institute-specific and must keep their own content: `lib/siteConfig.ts`, the palette block in `app/globals.css`,
   `models/department.ts`, everything in `public/`, `IMAGE_CREDITS.md`, `scripts/deploy.sh` (project guard), `.github/workflows/deploy.yml`,
   About/FAQ/Heritage copy. Resolve conflicts in favour of the institute for these.
3. Set that institute's four colours in `BRAND` and `globals.css`; the test in 4.3 must pass.
4. Run: `bun install --frozen-lockfile`, `bunx tsc --noEmit`, the tests folder by folder (playbook section 7).
5. Deploy to staging, test in app mode (section 7), then merge to `main`.
Never touch another institute's cloud project; the deploy guard in `scripts/deploy.sh` exists for this reason.
**Roll-out order (decided by the owner):** AIIMS Delhi first (live but not launched), then IIT Delhi (live but not launched).
Only when both are working and tested go to **IIT Roorkee (AlumBond): a real live site with about 6000 members**, then the
rest in batches. Experiments are allowed on AIIMS Delhi and IIT Delhi; IIT Roorkee gets nothing that has not already run on both.

Risk tiers, so Roorkee is never surprised:
- **Tier A, app mode (sections 2 and 4.1/4.3):** everything is gated by the `COVApp` user agent or is a new endpoint. A normal visitor's
  page is byte-for-byte the same (except the added CSS classes and variables, which have no effect without `data-app`). Low risk.
- **Tier B, section 2.3 (spacing variables) and section 3 (mobile browser look):** these change what every visitor sees. Test on
  staging with screenshots at 360, 390 and 430 px wide, signed in and out, before Roorkee. Roll out Tier B to Roorkee separately, later,
  and only if the owner wants it.
- Always deploy to the institute's `staging` first. Never push to Roorkee `main` on a Friday evening or without the owner watching.

## 7. Verification checklist (per site, staging)
With the user agent set to `COVApp/1.0.0` (or the app pointed at staging):
- Home: signed out redirects to login; signed in shows the dashboard, no navbar, no footer, no share bubble.
- Every tab page and every More-menu page: no empty gap at the top; the first content sits about 12px below the app's top bar.
- Pages with sticky bars (matrimonial profile, privacy policy contents, session details): bar pinned at the top, no gap above it.
- Admin: `/admin` shows its own header and menu; non-admin cannot see the shield.
- Unverified member sees the unverified overlay full screen.
- `/api/app/v1/me` returns 401 signed out and the right name and photo signed in.
- Without the token (normal browser): site looks and behaves exactly as before except section 3 changes.
- Dark mode, if enabled in the site, is not affected in the app (the app is light only).
Screenshots of each page in both modes go in the PR.

## 8. Order of work and rough effort
1. Section 2.2 and 2.3 on the reference site: about a day. Immediately removes the heuristics and gaps in the app.
2. Section 4.1 and 4.3: half a day. Lets the app drop scraping and copy the palette.
3. Section 2.4 (app home, app login): one to two days.
4. Section 3: one day.
5. Roll-out per institute: about half a day each once the shell is merged.
6. Section 4.4 and native screens: a screen at a time after the above.

Open decisions for the owner: keep or remove the share bubble in the app; whether the app home is the dashboard (recommended) or
the marketing page; (answered: IIT Delhi second, IIT Roorkee last, see section 6).
