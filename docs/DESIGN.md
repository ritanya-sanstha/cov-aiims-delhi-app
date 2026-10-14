# COV app design system (model-standard prototype)

Visual reference: Claude Design canvas "COV App Design System"
https://claude.ai/artifact/AHhagGh92JwwrGPXdDaknb (private; owner: Vishnu Kant). It holds every screen
(Home, Helpline, Directory, Jobs, More, Alerts, Profile, Login, sub-page frame, offline/loading/empty states),
the token sheet, a three-institute theme comparison and an inventory of every app screen.

## Per-institute inputs (register file, nothing else changes between institutes)
| Input | Register field | AIIMS Delhi |
|---|---|---|
| Name shown in the app | `institute.shortName` | AIIMS Delhi |
| Line under it (same for all) | `standard.programName` | Community of Volunteers |
| Logo (square file, shown round) | `branding.logoFile` | aiims-delhi-logo.png |
| Primary | `branding.primaryColor` | #2E4D23 (website `--primary`) |
| Highlight | `branding.accentColor` | #F9BF1F (website `--brand-gold`) |
| Secondary (new) | `branding.secondaryColor` | #2E7BA3 (website `--brand-blue`) |
| Alert (new) | `branding.alertColor` | #B54321 (website `--brand-accent`) |

Rule: copy each institute's palette from its website stylesheet (`app/globals.css` in `cov-<inst>`), so the app
bars match the page under them. Today the AIIMS register still has navy #1B2B5E and gold #C9A84C: change it.

## Fixed for every institute
- Fonts: Plus Jakarta Sans (titles) and Geist (text), the same as the website.
- Ground #F2F3F7, white cards, 20px corners, soft shadow, 12px side margin. Tab bar: floating pill, 22px corners.
- Text #171717, muted #5F6672. Status chips: success #2D6A2D on #E4F3E4, pending #6B4F00 on #FDF3CF, info #1F6285 on #E3F0F7.
- Type: bar title 18/800, screen title 26/800, card title 16/700, body 15, secondary 13, tab label 10/700 caps.
- Touch targets 44px or more (filter chips 40px). Body text 14px or larger.
- Titles show the institute name, never "COV –".

## Screen map
Tabs: Home, Helpline, Directory, Jobs, More. From the top bar: Alerts (bell), Profile (avatar), Admin (shield, admins).
All other pages (More menu items, shared links) use the sub-page frame: back chevron card + page.
Target Home is a member dashboard (next session, quick actions, alerts); today it is the website home.

## Gaps between this design and the current app (punch list)
1. Palette: register still navy/gold; apply the website palette, add `secondaryColor` and `alertColor`.
2. Fonts: the app uses the system font; load Plus Jakarta Sans and Geist (expo-font) for native text.
3. Website pages in app mode: ground #F2F3F7 behind white cards, no hero/footer; needs the website to serve
   an app layout for the `COVApp` user agent (see WEBSITE_APP_MODE.md).
4. Login: designed as a native-looking page; today it is the website login page in a WebView.
5. Native Home dashboard and native tab screens need website JSON endpoints (`/api/app/v1/*`), not built.
