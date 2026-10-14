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
 * 3. With `nativeHeader` the website's floating header is hidden (the app shows
 *    its own top bar) except on REGISTER.website.keepSiteHeaderPaths, and the
 *    gap it leaves at the top of the page is trimmed. The header is found by
 *    behaviour: fixed/sticky, at the top, full width, containing the institute name.
 * 4. The page is told it is inside the app: <html data-app="android" class="in-app">
 *    and window.__IN_APP (the user agent carries the same token, see appUserAgent()).
 */
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { REGISTER } from './config';
import { setSiteChrome } from './session';

/** Token appended to the WebView user agent: "COVApp/1.0.0". */
export function appUserAgent(): string {
  const token = REGISTER.website.appUserAgentToken ?? 'App';
  return `${token}/${Constants.expoConfig?.version ?? '1.0.0'}`;
}

export function siteInjectedScript(): string {
  const markers = (REGISTER.website.hideSiteBottomNavMarkers ?? []).map((m) => m.toLowerCase());
  const brand = REGISTER.institute.name.replace(/\s+/g, ' ').trim().toLowerCase();
  const fontPx = REGISTER.website.headerTitleFontPx ?? 14;
  const hideFooter = REGISTER.website.hideSiteFooter ?? false;
  const nativeHeader = REGISTER.website.nativeHeader ?? false;
  const keepPaths = REGISTER.website.keepSiteHeaderPaths ?? [];
  return `
(function () {
  if (window.__siteTweaks) return;
  window.__siteTweaks = true;
  var markers = ${JSON.stringify(markers)};
  var brand = ${JSON.stringify(brand)};
  var fontPx = ${JSON.stringify(fontPx)};
  var hideFooter = ${JSON.stringify(hideFooter)};
  var nativeHeader = ${JSON.stringify(nativeHeader)};
  var keepPaths = ${JSON.stringify(keepPaths)};

  // --- tell the page it is inside the app ---
  window.__IN_APP = true;
  function markApp() {
    var root = document.documentElement; // null this early on some loads: retried from run()
    if (root && root.getAttribute('data-app') !== 'android') {
      root.setAttribute('data-app', 'android');
      root.classList.add('in-app');
    }
  }

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
      var t = (el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
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

  // --- native header: hide the website's floating header, trim the gap ---
  var hdr = null, hdrBottom = 0, trimPath = null, trims = 0, lastTrim = 0, chromeSig = '';
  function headerKept() {
    var p = location.pathname;
    for (var i = 0; i < keepPaths.length; i++) {
      if (p === keepPaths[i] || p.indexOf(keepPaths[i] + '/') === 0) return true;
    }
    return false;
  }
  function findHeader() {
    var els = document.querySelectorAll('nav,header,.fixed,.sticky');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 || r.top > 60 || r.bottom > 220 || r.width < window.innerWidth * 0.8) continue;
      if ((el.textContent || '').replace(/\\s+/g, ' ').toLowerCase().indexOf(brand) < 0) continue;
      return el;
    }
    return null;
  }
  // First visible content that is not part of a fixed/sticky bar: { top: page-top px, el }.
  function firstContentTop() {
    var fixedList = [], best = Infinity, bestEl = null;
    var all = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i], tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      var pos = getComputedStyle(el).position;
      // fixed/sticky bars and absolutely positioned decoration (hero background photos...) are not content
      if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute') { fixedList.push(el); continue; }
      var inFixed = false;
      for (var f = 0; f < fixedList.length; f++) { if (fixedList[f].contains(el)) { inFixed = true; break; } }
      if (inFixed) continue;
      var own = false;
      for (var c = el.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3 && c.nodeValue.trim()) { own = true; break; } }
      if (!own && !/^(IMG|svg|VIDEO|CANVAS|INPUT|BUTTON|TEXTAREA|SELECT)$/i.test(tag)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      var top = r.top + window.pageYOffset;
      if (top < best) { best = top; bestEl = el; }
    }
    return { top: best, el: bestEl };
  }
  // The hidden header leaves its reserved space empty at the top of the page. Close the gap
  // by reducing the top padding/margin of the first content's ancestors (never below zero, so
  // nothing can end up above the start of the page and become unreachable). A few tries per
  // page, because content renders after load.
  var trimmed = [];
  function undoTrim() {
    for (var i = 0; i < trimmed.length; i++) {
      var t = trimmed[i];
      if (t.prev) t.el.style.setProperty(t.prop, t.prev, t.prio); else t.el.style.removeProperty(t.prop);
      t.el.__stickyDone = false;
    }
    trimmed = [];
  }
  function trimTop() {
    var path = location.pathname;
    if (trimPath !== path) { undoTrim(); trimPath = path; trims = 0; }
    var now = Date.now();
    if (trims >= 6 || now - lastTrim < 700 || !document.body) return;
    trims++; lastTrim = now;
    undoTrim();
    fixStickyOffsets();
    var f = firstContentTop();
    var left = f.top - 12;
    if (!f.el || !isFinite(f.top) || left <= 0) return;
    var chain = [];
    for (var n = f.el; n && n !== document.documentElement; n = n.parentElement) chain.unshift(n);
    for (var k = 0; k < chain.length && left > 0; k++) {
      var cs = getComputedStyle(chain[k]);
      var props = ['padding-top', 'margin-top'];
      for (var q = 0; q < props.length && left > 0; q++) {
        var v = parseFloat(cs.getPropertyValue(props[q])) || 0;
        if (v <= 0) continue;
        var cut = Math.min(v, left);
        var st = chain[k].style;
        trimmed.push({ el: chain[k], prop: props[q], prev: st.getPropertyValue(props[q]), prio: st.getPropertyPriority(props[q]) });
        st.setProperty(props[q], (v - cut) + 'px', 'important');
        left -= cut;
      }
    }
  }
  // Sticky bars pinned below the (now hidden) header, e.g. "sticky top-16": pull them up to the top.
  function fixStickyOffsets() {
    if (!hdrBottom) return;
    var els = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el === hdr || (hdr && hdr.contains(el)) || el.__stickyDone) continue;
      var cs = getComputedStyle(el);
      if (cs.position !== 'sticky') continue;
      var top = parseFloat(cs.top);
      if (!isFinite(top) || top <= 0 || top > 200) continue;
      el.__stickyDone = true;
      var st = el.style;
      trimmed.push({ el: el, prop: 'top', prev: st.getPropertyValue('top'), prio: st.getPropertyPriority('top') });
      st.setProperty('top', Math.max(0, top - hdrBottom) + 'px', 'important');
    }
  }
  // Tell the app who is signed in (admin link, profile photo / initials) from the header it hides.
  function avatarData(img) {
    try {
      if (img && img.complete && img.naturalWidth) {
        var c = document.createElement('canvas'); c.width = 96; c.height = 96;
        c.getContext('2d').drawImage(img, 0, 0, 96, 96);
        return c.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {}
    return img ? (img.currentSrc || img.src || '') : '';
  }
  function reportChrome() {
    if (!hdr) return;
    var a = hdr.querySelector('a[href$="/profile"]') || hdr.querySelector('a[href*="/profile"]');
    var img = a ? a.querySelector('img') : null;
    var avatar = img ? avatarData(img) : '';
    var initials = a && !img ? (a.textContent || '').replace(/\\s+/g, '').slice(0, 2) : '';
    var admin = !!hdr.querySelector('a[href*="/admin"]');
    var sig = admin + '|' + initials + '|' + avatar.length + avatar.slice(-24);
    if (sig === chromeSig) return;
    chromeSig = sig;
    post({ kind: 'chrome', admin: admin, avatar: avatar, initials: initials, signedIn: !!a });
  }
  function nativeHeaderRun() {
    if (!nativeHeader) return;
    if (headerKept()) {
      if (hdr) { hdr.style.removeProperty('display'); hdr = null; chromeSig = ''; }
      undoTrim();
      trimPath = null;
      return;
    }
    if (!hdr || !document.contains(hdr)) {
      hdr = findHeader();
      if (!hdr) return;
      hdrBottom = Math.round(hdr.getBoundingClientRect().bottom);
    }
    reportChrome();
    if (hdr.style.getPropertyValue('display') !== 'none') hdr.style.setProperty('display', 'none', 'important');
    trimTop();
  }

  function post(o) {
    try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch (e) {}
  }

  // --- upload diagnostics: wrap fetch / XHR for requests that send files ---
  function isUploadBody(b) {
    try { return !!b && ((typeof FormData !== 'undefined' && b instanceof FormData) || (typeof Blob !== 'undefined' && b instanceof Blob)); } catch (e) { return false; }
  }
  function pathOf(u) { try { return new URL(u, location.href).pathname; } catch (e) { return ''; } }
  if (window.fetch && !window.__fetchWrapped) {
    window.__fetchWrapped = true;
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      var up = method !== 'GET' && isUploadBody(init && init.body);
      var p = origFetch.apply(this, arguments);
      if (!up) return p;
      var path = pathOf(typeof input === 'string' ? input : input && input.url);
      return p.then(function (res) {
        if (!res.ok) {
          res.clone().text().then(function (t) { post({ kind: 'upload-error', status: res.status, path: path, detail: (t || '').slice(0, 160) }); })
            .catch(function () { post({ kind: 'upload-error', status: res.status, path: path, detail: '' }); });
        }
        return res;
      }, function (err) {
        post({ kind: 'upload-error', status: 0, path: path, detail: String((err && err.message) || err) });
        throw err;
      });
    };
  }
  if (window.XMLHttpRequest && !window.__xhrWrapped) {
    window.__xhrWrapped = true;
    var X = XMLHttpRequest.prototype, origOpen = X.open, origSend = X.send;
    X.open = function (m, u) { this.__m = String(m || 'GET').toUpperCase(); this.__u = u; return origOpen.apply(this, arguments); };
    X.send = function (b) {
      var self = this;
      if (this.__m !== 'GET' && isUploadBody(b)) {
        this.addEventListener('loadend', function () {
          if (self.status < 200 || self.status >= 300) {
            var d = ''; try { d = (self.responseType === '' || self.responseType === 'text') ? String(self.responseText || '').slice(0, 160) : ''; } catch (e) {}
            post({ kind: 'upload-error', status: self.status, path: pathOf(self.__u), detail: d });
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // --- app-feel clean-ups ---
  function appFeel() {
    if (!document.getElementById('__app_css')) {
      var host = document.head || document.documentElement;
      if (host) {
        var st = document.createElement('style');
        st.id = '__app_css';
        st.textContent = 'html,body{overscroll-behavior-y:none}a,button,[role=button]{-webkit-tap-highlight-color:transparent}';
        host.appendChild(st);
      }
    }
    if (hideFooter) {
      var fs = document.querySelectorAll('footer');
      for (var i = 0; i < fs.length; i++) fs[i].style.setProperty('display', 'none', 'important');
    }
  }

  function run() { markApp(); hideBottomBar(); nativeHeaderRun(); compactHeaderTitle(); appFeel(); }
  run();
  var timer = null;
  new MutationObserver(function () {
    if (timer) return;
    timer = setTimeout(function () { timer = null; run(); }, 300);
  }).observe(document, { childList: true, subtree: true });
})();
true;
`;
}

let lastUploadAlert = 0;

/** Plain-language reason for an HTTP status from the website's upload request. */
function uploadReason(status: number): string {
  if (status === 0) return 'The server could not be reached, or the request was blocked.';
  if (status === 401 || status === 403) return 'The server refused it (not allowed, or the login session has expired). Sign out and in again, then retry.';
  if (status === 404) return 'The upload address was not found on the server.';
  if (status === 413) return 'The file is too large for the server. Try a smaller file.';
  if (status === 415) return 'The server does not accept this file type.';
  if (status === 429) return 'Too many requests. Wait a minute and retry.';
  if (status >= 500) return 'The server had an error while saving the file.';
  return 'The server rejected the file.';
}

/** onMessage handler for site WebViews: shows why an upload failed. */
export function handleSiteMessage(data: string): void {
  let msg: { kind?: string; status?: number; path?: string; detail?: string; admin?: boolean; avatar?: string; initials?: string; signedIn?: boolean };
  try { msg = JSON.parse(data); } catch { return; }
  if (msg.kind === 'chrome') { setSiteChrome({ admin: !!msg.admin, avatar: msg.avatar || '', initials: msg.initials || '' }); return; }
  if (msg.kind !== 'upload-error') return;
  const now = Date.now();
  if (now - lastUploadAlert < 5000) return;
  lastUploadAlert = now;
  const status = msg.status ?? 0;
  const detail = msg.detail ? `\n\nServer says: ${msg.detail}` : '';
  Alert.alert(
    'Upload failed',
    `${uploadReason(status)}\n\nTechnical: ${status === 0 ? 'no response' : 'HTTP ' + status}${msg.path ? ' on ' + msg.path : ''}${detail}`,
  );
}
