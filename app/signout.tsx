/**
 * app/signout.tsx — sign the user out of the website *inside the app*.
 *
 * The website's Sign Out is a button on its profile page (not a URL), and the
 * app's login lives in the WebView cookie jar, so signing out in the phone's
 * browser would not log the app out. We open the profile page here, press the
 * website's own Sign Out button, and when the website moves on we return to
 * the login screen. The page stays visible, so the user can also tap the
 * button themselves (or confirm a dialog) if the automatic press fails.
 *
 * Configure in the register: website.profilePath, website.signOutButtonText.
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WebView, { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { appUserAgent } from '../src/siteScripts';
import { REGISTER, siteUrl, isAllowedUrl } from '../src/config';
import { clearLandingUrl } from '../src/session';
import AppBar, { APP_BG } from '../src/components/AppBar';
import { colors, fonts } from '../src/theme';

const { profilePath, loginPath, signOutButtonText } = REGISTER.website;

// Presses the website's Sign Out button once it appears, then reports every
// path change (the site may navigate without a full page load).
const PRESS_SIGN_OUT_JS = `
(function () {
  var label = ${JSON.stringify(signOutButtonText.trim().toLowerCase())};
  var start = location.pathname;
  var tries = 0;
  var finder = setInterval(function () {
    tries++;
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim().toLowerCase() === label) {
        clearInterval(finder);
        window.ReactNativeWebView.postMessage('pressed');
        btns[i].click();
        var watch = setInterval(function () {
          if (location.pathname !== start) {
            clearInterval(watch);
            window.ReactNativeWebView.postMessage('moved:' + location.pathname);
          }
        }, 300);
        setTimeout(function () { clearInterval(watch); }, 20000);
        return;
      }
    }
    if (tries > 40) {
      clearInterval(finder);
      window.ReactNativeWebView.postMessage('notfound');
    }
  }, 250);
})();
true;
`;

export default function SignOutScreen() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const pressed = useRef(false);
  const finished = useRef(false);
  const [hint, setHint] = useState('');

  function finish() {
    if (finished.current) return;
    finished.current = true;
    clearLandingUrl();
    router.replace('/(auth)/login');
  }

  function handleMessage(e: WebViewMessageEvent) {
    const msg = e.nativeEvent.data;
    if (msg === 'pressed') pressed.current = true;
    else if (msg === 'notfound') setHint(`Tap "${signOutButtonText}" on the page to finish signing out.`);
    else if (msg.startsWith('moved:')) finish();
  }

  function handleNavigationStateChange(nav: WebViewNavigation) {
    if (!nav.url) return;
    let path = '';
    try { path = new URL(nav.url).pathname; } catch { return; }
    // Redirected to login without us pressing anything: already signed out.
    if (path.startsWith(loginPath)) finish();
    // After pressing, any move away from the profile page means it worked.
    else if (pressed.current && path !== profilePath) finish();
  }

  return (
    <View style={styles.container}>
      {focused && <StatusBar style="dark" />}
      <AppBar title="Signing out…" onBack={() => router.back()} />
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      <WebView
        source={{ uri: siteUrl(profilePath) }}
        applicationNameForUserAgent={appUserAgent()}
        style={styles.webview}
        injectedJavaScript={PRESS_SIGN_OUT_JS}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(r) => isAllowedUrl(r.url)}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={REGISTER.website.allowedDomains.map((d) => `https://${d}`)}
        // target=_blank / window.open load in this view; without this they were dropped
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        mixedContentMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_BG },
  hint: { marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: colors.pendingTint, color: colors.pending, fontFamily: fonts.medium, fontSize: 14 },
  webview: { flex: 1 },
});
