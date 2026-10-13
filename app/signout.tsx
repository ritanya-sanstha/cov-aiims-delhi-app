/**
 * app/signout.tsx — sign the user out of the website *inside the app*.
 *
 * The app's pages keep their login in the WebView cookie jar, so signing out
 * in the phone's browser would not log the app out. We open the website's own
 * sign-out page (REGISTER.website.logoutPath) in a WebView; when it finishes
 * and the website sends us elsewhere, we return to the login screen.
 *
 * If the logout path is wrong the website's 404 shows here and the user can
 * tap Cancel. Fix it in the register (website.logoutPath), not in code.
 */
import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { REGISTER, siteUrl, isAllowedUrl } from '../src/config';
import { clearLandingUrl } from '../src/session';

export default function SignOutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onSignOutPage = useRef(false);
  const finished = useRef(false);
  const logoutPath = REGISTER.website.logoutPath;

  function handleNavigationStateChange(nav: WebViewNavigation) {
    if (finished.current || !nav.url) return;
    let path = '';
    try { path = new URL(nav.url).pathname; } catch { return; }

    if (path.startsWith(logoutPath)) {
      onSignOutPage.current = true;       // confirmation page shown
    } else if (onSignOutPage.current) {
      finished.current = true;            // website moved on after signing out
      clearLandingUrl();
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { paddingTop: insets.top + 8, backgroundColor: REGISTER.branding.primaryColor }]}>
        <Text style={styles.title}>Sign out</Text>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={[styles.cancel, { color: REGISTER.branding.accentColor }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: siteUrl(logoutPath) }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(r) => isAllowedUrl(r.url)}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={REGISTER.website.allowedDomains.map((d) => `https://${d}`)}
        allowFileAccess={false}
        mixedContentMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cancel: { fontSize: 16, fontWeight: '600' },
  webview: { flex: 1 },
});
