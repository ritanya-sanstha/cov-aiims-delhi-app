/**
 * src/siteScripts.ts — script injected into the website's pages (SiteWebView,
 * InAppPage). Two clean-ups for the in-app view, both found by behaviour (not
 * CSS class names, which change when the site is rebuilt):
 *
 * 1. Hide the website's own floating bottom bar (it stacks on the native tab
 *    bar): a fixed element in the lower half of the screen whose text contains
 *    every marker in REGISTER.website.hideSiteBottomNavMarkers ([] = off).
 * 2. Keep the website's header title on ONE line at a smaller size. On a phone
 *    "COV – AIIMS Delhi" wraps to two lines, making the header tall so it
 *    covers the top of the page. The title element is the one whose whole text
 *    is the institute name, inside a fixed/sticky header; it gets nowrap, a
 *    smaller font and an ellipsis (REGISTER.website.headerTitleFontPx, 0 = off).
 */
import { REGISTER } from './config';

export function siteInjectedScript(): string {
  const markers = (REGISTER.website.hideSiteBottomNavMarkers ?? []).map((m) => m.toLowerCase());
  const brand = REGISTER.institute.name.replace(/\s+/g, ' ').trim().toLowerCase();
  const fontPx = REGISTER.website.headerTitleFontPx ?? 14;
  if (markers.length === 0 && !fontPx) return 'true;';
  return `
(function () {
  if (window.__siteTweaks) return;
  window.__siteTweaks = true;
  var markers = ${JSON.stringify(markers)};
  var brand = ${JSON.stringify(brand)};
  var fontPx = ${JSON.stringify(fontPx)};

  function isFixedOrSticky(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  }

  function hideBottomBar() {
    if (markers.length === 0) return;
    var els = document.querySelectorAll('.fixed');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__navHidden) continue;
      if (getComputedStyle(el).position !== 'fixed') continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 || r.top < window.innerHeight / 2) continue;
      var t = (el.innerText || el.textContent || '').toLowerCase();
      var all = true;
      for (var j = 0; j < markers.length; j++) { if (t.indexOf(markers[j]) < 0) { all = false; break; } }
      if (all) { el.style.setProperty('display', 'none', 'important'); el.__navHidden = true; }
    }
  }

  function compactHeaderTitle() {
    if (!fontPx) return;
    var cands = document.querySelectorAll('span,a,div,p,h1,h2');
    for (var i = 0; i < cands.length; i++) {
      var el = cands[i];
      if (el.__titleDone || el.children.length > 0) continue;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (t !== brand) continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 || r.top > 200 || !isFixedOrSticky(el)) continue;
      el.__titleDone = true;
      var s = el.style;
      s.setProperty('white-space', 'nowrap', 'important');
      s.setProperty('font-size', fontPx + 'px', 'important');
      s.setProperty('line-height', '1.25', 'important');
      s.setProperty('overflow', 'hidden', 'important');
      s.setProperty('text-overflow', 'ellipsis', 'important');
      s.setProperty('min-width', '0', 'important');
      // let the title shrink inside its flex row instead of wrapping
      for (var n = el.parentElement, k = 0; n && k < 3; n = n.parentElement, k++) {
        n.style.setProperty('min-width', '0', 'important');
      }
    }
  }

  function run() { hideBottomBar(); compactHeaderTitle(); }
  run();
  var timer = null;
  new MutationObserver(function () {
    if (timer) return;
    timer = setTimeout(function () { timer = null; run(); }, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
true;
`;
}
