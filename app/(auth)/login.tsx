/**
 * app/(auth)/login.tsx — Login screen
 *
 * Shows the website's own /login page inside a full-screen WebView.
 * The website handles all OTP/WhatsApp/password logic.
 * When the website redirects away from /login (to the member home etc.),
 * we know the user has logged in → navigate to the main tabs.
 *
 * Security:
 *  - Only allows navigation within our whitelisted domains
 *  - The HttpOnly session cookie is set by the website's server response
 *    and lives in the system WebView cookie jar (inaccessible to JS)
 */
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { appUserAgent } from '../../src/siteScripts';
import { isLoggedIn } from '../../src/auth';
import { REGISTER, siteUrl, isAllowedUrl } from '../../src/config';
import { setLandingUrl } from '../../src/session';
import { APP_BG } from '../../src/components/AppBar';
import { colors } from '../../src/theme';

// Extra space (dp) between the status bar and the website's login page.
const LOGIN_TOP_GAP = 28;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));

  const loginUrl = siteUrl(REGISTER.website.loginPath);

  // The page can leave /login without a login (logo, Register, Forgot password...), so
  // moving to another URL proves nothing: confirm with the website that we are signed in.
  const checking = useRef(false);
  const done = useRef(false);

  async function confirmLogin(url: string) {
    if (checking.current || done.current) return;
    checking.current = true;
    try {
      // the cookie can take a moment to be readable right after the redirect
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await isLoggedIn(4000)) {
          done.current = true;
          // Remember where the website sent us: the Home tab shows this page
          setLandingUrl(url);
          router.replace('/(tabs)/home');
          return;
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    } finally {
      checking.current = false;
    }
  }

  function handleNavigationStateChange(navState: WebViewNavigation) {
    const { url } = navState;
    if (!url) return;
    const isOnLoginPage = url.includes(REGISTER.website.loginPath);
    if (!isOnLoginPage && isAllowedUrl(url)) confirmLogin(url);
  }

  function handleShouldStartLoadWithRequest(request: { url: string }) {
    // Block external links (open them in the device browser instead)
    if (!isAllowedUrl(request.url)) {
      return false; // block
    }
    return true;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + LOGIN_TOP_GAP }]}>
      {focused && <StatusBar style="dark" />}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: loginUrl }}
        applicationNameForUserAgent={appUserAgent()}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadEnd={() => setLoading(false)}
        // Security hardening
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        originWhitelist={REGISTER.website.allowedDomains.map(d => `https://${d}`)}
        // target=_blank / window.open load in this view; without this they were dropped
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        // Pull-to-refresh not needed on login
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APP_BG,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
