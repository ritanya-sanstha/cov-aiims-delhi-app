# Project memory: COV institute app (Ritanya Sanstha)

Read this first in every session on this repo.

## What this repo is
`cov-aiims-delhi-app` is the **model-standard prototype** for the COV mobile apps. The first app, for
**AIIMS Delhi**, is built and perfected here, then replicated for many institutes (about 20 planned,
for example IIT Delhi, IIT Roorkee (AlumBond), IIT Kanpur and more). Everything done here must therefore
be institute-neutral: anything specific to one institute lives in its **register file**
(`registers/<institute>.register.json`), never in code. If a change only works for AIIMS Delhi, it is wrong.

Each institute already has its own website, built from one standard shell by the website team:
`https://<sub>.ritanyasanstha.in` (AIIMS Delhi: `aiimsdelhi.`), repo `ritanya-sanstha/cov-<inst>` (for AIIMS Delhi
`cov-aiims-delhi`, private, Next.js + Cloud SQL + Cloud Run). The website playbook is
`.agents/docs/new-institute-playbook.md` in that repo (verified on COV - IIT Delhi and IIT Kanpur;
it uses a 2-letter community code per institute and `scripts/apply-institute.py` to rename the shell).
The app wraps that website (WebView) plus native navigation. Owner: Vishnu Kant (vishnukant2050@gmail.com).

Not yet read: https://ritanyasanstha.in itself (not reachable from the Claude cloud session). Ask the owner
for details about the full institute list if needed. The AlumBond (IIT Roorkee) app has no repo in this
session yet; when it exists, apply the same rules there.

## Naming rule (important)
- **COV** ("Community of Volunteers") is common to all apps. It is NOT the institute's name.
- In the app UI the **institute name** is shown (`institute.shortName`, e.g. "AIIMS Delhi", "IIT Roorkee"),
  with `standard.programName` ("Community of Volunteers") as the small line under it. Do not show "COV –" in titles.
- `institute.name` ("COV – AIIMS Delhi") is only the website's own header text; the injected script uses it
  to find the website header. Do not display it.
- Launcher label is `app.appName` (e.g. "AIIMS Delhi Alumni").

## Register file = the only per-institute input
Names, colours, logo file (`assets/logos/<file>`, copied to `assets/brand/logo.png` by
`scripts/apply-branding.js`), website base URL and paths, tabs, More menu, android package, version.
Types and a fallback copy are in `src/config/index.ts` (keep both in sync with the JSON).
New institute = new register + logo + one workflow `REGISTER_FILE`, nothing else.

## How the app works
- Expo SDK 53 / React Native 0.79 / expo-router. Pinned versions in `package.json`: do not change SDK casually.
- Login: the website's `/login` page in a WebView. Success is **confirmed by asking the website**
  (`src/auth.ts` `isLoggedIn()` fetches a member-only page), never inferred from a URL change.
- Tabs (Home, Helpline, Directory, Jobs) are the website pages in a WebView under a native `AppBar`
  (floating card) with a floating tab bar. More is a native screen. Other pages open in `InAppPage`.
- `src/siteScripts.ts` is injected into the website pages: hides the website's own header/bottom bar/footer,
  closes the gap they leave, reports admin link and profile photo to the native bar, reports failed uploads.
  It finds things by behaviour, not CSS class names. Contract with the website: `docs/WEBSITE_APP_MODE.md`
  (user-agent token `COVApp/<version>`, `<html data-app>`, `window.__IN_APP`).
- Deep links: Android App Links for the website host; the website must serve `/.well-known/assetlinks.json`
  (`docs/assetlinks.json`).

## Build and release
- Only GitHub Actions (`.github/workflows/android-build.yml`); no EAS. Push to `main` builds (about 15 min),
  publishes the APK to the `latest-build` release. Never patch generated native code in the workflow; fix
  `package.json` / `app.config.js` instead.
- Signed with the template debug keystore (stable fingerprint in `docs/assetlinks.json`). Play Store needs a real upload key.
- The user merges PRs (the assistant never merges) and tests on a real phone (Pixel).

## Lessons learned (do not repeat)
- Injected JS lives inside a TypeScript template string: write `\\s`, not `\s` (a lone backslash is dropped).
- Never close gaps with negative margins (content can end up unreachable); reduce padding/margin, never below 0.
- Do not guess login state from URLs; do not assume the website is at fault before checking what the app sent.
- Mixed React Native/Expo versions broke builds for a long time: keep the SDK aligned, no source patches.
- Verify on the real site structure: read `ritanya-sanstha/cov-aiims-delhi` code instead of guessing (e.g. Hero shows
  Register when the server sees no session; Navbar markup; AuthGuard public routes).
- The assistant cannot run Android or a phone: say clearly what is untested; ask for screenshots.

## Working rules with the owner
- One batch of fixes per build; collect items, open one PR when told. Do not open PRs unasked.
- Owner prefers action over discussion, honest status, and root causes over workarounds.
- Design direction: AlumBond.in on a phone is the look to match (floating cards, light, clean). A native-screens
  version (API-backed, fast) is planned after the web-wrapped look is solid; it needs `/api/app/v1/*` endpoints
  added to each institute's website repo (website changes only via PRs the owner merges).

## Roll-out order and safety
AIIMS Delhi (live, not launched) first, then IIT Delhi (live, not launched). IIT Roorkee (AlumBond) is a real live site with about
6000 members: touch it only after both have been tested, staging first, and only with changes that already ran on both.
Tier A (UA-gated app mode) is low risk; changes visible to every visitor (Tier B) need screenshots and the owner's go. See `docs/WEB_ALIGNMENT.md`.

## Design
Design system and every screen: `docs/DESIGN.md` (Claude Design canvas linked there). Follow it for any UI change.

## Open items
- Website: publish `assetlinks.json`; fix `/api/upload` (HTTP 500 "Failed to upload file", owner is on it);
  serve an app layout when the `COVApp` user agent is present.
- Decide: remove the green share bubble? Native screens plan; Play Store signing.
