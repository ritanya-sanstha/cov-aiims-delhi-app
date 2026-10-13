# Telling the website it is running inside the app

The mobile app shows the website in a WebView. It identifies itself three ways, so the
website can serve an app-friendly layout (no floating header, no footer, no bottom nav).

| Signal | Where | Example |
|---|---|---|
| User agent token | HTTP `User-Agent` header and `navigator.userAgent` | `... Chrome/124 Mobile Safari/537.36 COVApp/1.0.0` |
| HTML attribute / class | `<html data-app="android" class="in-app">` (set by the app after load) | CSS: `html[data-app] nav.site-header { display: none }` |
| JS flag | `window.__IN_APP === true` | |

Server side (SSR) can use the user-agent token (`/COVApp\/[\d.]+/`), so the correct layout
is rendered on the first paint, without the flicker of hiding things afterwards.

## What the app does today (without any website change)
- Hides the website's floating header and shows its own top bar (title, alerts, profile,
  admin panel for admins). The header is kept on `/admin*` pages (register
  `website.keepSiteHeaderPaths`), where it carries the admin navigation.
- Hides the website's bottom bar and footer, and trims the gap left at the top.
These are found by behaviour (fixed element, top, contains the institute name), not CSS class
names, but a website-side switch on the signals above is more reliable.

## Suggested website changes
1. When the user agent has the token: do not render the floating header, footer or the bottom
   nav, and drop the top padding that reserved space for the header.
2. Keep the admin pages' navigation visible.
