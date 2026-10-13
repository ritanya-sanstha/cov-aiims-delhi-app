/**
 * src/siteScripts.ts — scripts injected into the website's pages.
 */
import { REGISTER } from './config';

/**
 * The website draws its own floating bottom navigation bar on phones. Inside
 * the app that stacks on top of the native tab bar, so hide it.
 *
 * The bar is found by behaviour, not by CSS class names (which change when the
 * site is rebuilt): a fixed-position element in the lower half of the screen
 * whose text contains every marker in REGISTER.website.hideSiteBottomNavMarkers.
 * Set that list to [] in the register to switch this off.
 */
export function hideSiteBottomNavScript(): string {
  const markers = (REGISTER.website.hideSiteBottomNavMarkers ?? []).map((m) => m.toLowerCase());
  if (markers.length === 0) return 'true;';
  return `
(function () {
  if (window.__hideBottomNav) return;
  window.__hideBottomNav = true;
  var markers = ${JSON.stringify(markers)};
  function hide() {
    var els = document.querySelectorAll('.fixed');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__navHidden) continue;
      if (getComputedStyle(el).position !== 'fixed') continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 || r.top < window.innerHeight / 2) continue;
      var t = (el.innerText || '').toLowerCase();
      var all = true;
      for (var j = 0; j < markers.length; j++) { if (t.indexOf(markers[j]) < 0) { all = false; break; } }
      if (all) { el.style.setProperty('display', 'none', 'important'); el.__navHidden = true; }
    }
  }
  hide();
  var timer = null;
  new MutationObserver(function () {
    if (timer) return;
    timer = setTimeout(function () { timer = null; hide(); }, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
true;
`;
}
