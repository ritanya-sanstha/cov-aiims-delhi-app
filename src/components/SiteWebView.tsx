/**
 * src/components/SiteWebView.tsx
 *
 * Reusable WebView that loads a page from our registered website.
 * Shared across ALL tab screens — every tab is an instance of this component
 * pointed at a different path.
 *
 * Features:
 *  - Loading spinner in institute primary color
 *  - Pull-to-refresh
 *  - Offline / error fallback with retry
 *  - Blocks external domain navigation (opens them in device browser instead)
 *  - Detects logout (redirect to /login) and returns to login screen
 *  - Hardware back button support (Android)
 *
 * Security:
 *  - originWhitelist restricts WebView to our allowed domains
 *  - file:// access disabled
 *  - mixed content blocked
 *  - HttpOnly cookies handled by system WebView (never accessible to JS)
 */
import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import WebView, { WebViewNavigation } from 'react-native-webview';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER, siteUrl, isAllowedUrl } from '../config';
import { appUserAgent, handleSiteMessage, siteInjectedScript } from '../siteScripts';
import AppBar, { APP_BG } from './AppBar';

const HIDE_SITE_NAV_JS = siteInjectedScript();

interface Props {
  path: string;        // e.g. '/', '/gethelp'
  /** Screen title for the app's own top bar (shown when website.nativeHeader is on) */
  title?: string;
  /** Small line under the title in the top bar */
  subtitle?: string;
  /** Optional: scroll-up when tab is tapped again (default true) */
  scrollToTopOnFocus?: boolean;
}

export default function SiteWebView({ path, title, subtitle }: Props) {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const loadedAt = useRef(0);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    // Coming back to a tab that has been away a while: reload, so the page reflects the
    // current login state and data (otherwise it can keep showing e.g. "Register").
    if (loadedAt.current && Date.now() - loadedAt.current > 60_000) webViewRef.current?.reload();
    return () => setFocused(false);
  }, []));
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  // Full-screen spinner only for the very first load; later navigations show
  // a thin progress bar so the page stays visible and taps feel instant.
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const url = siteUrl(path);

  const nativeBar = !!title && (REGISTER.website.nativeHeader ?? false);
  const primary = REGISTER.branding.primaryColor;
  const accent  = REGISTER.branding.accentColor;

  // Android hardware back button — navigate WebView back if possible
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Go back inside the page only if there is a page to go back to;
        // otherwise let Android handle Back (leave the screen / app).
        if (canGoBack.current) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [])
  );

  function handleNavigationStateChange(navState: WebViewNavigation) {
    canGoBack.current = navState.canGoBack;
    const { url: navUrl } = navState;
    if (!navUrl) return;

    // Detect session expiry — website redirected to /login
    if (navUrl.includes(REGISTER.website.loginPath)) {
      router.replace('/(auth)/login');
    }
  }

  function handleShouldStartLoadWithRequest(request: { url: string }) {
    if (isAllowedUrl(request.url)) return true;
    // Open external links in the device's default browser
    Linking.openURL(request.url).catch(() => {});
    return false;
  }

  function handleError(_e: WebViewErrorEvent) {
    setError(true);
    setInitialLoading(false);
  }

  function handleRefresh() {
    setError(false);
    setRefreshing(true);
    webViewRef.current?.reload();
    setTimeout(() => setRefreshing(false), 1500);
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={[styles.center, { backgroundColor: '#F0F2F5', paddingTop: insets.top + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} />}
      >
        <Ionicons name="wifi-outline" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>No connection</Text>
        <Text style={styles.errorSub}>Pull down to retry</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primary }]} onPress={handleRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: nativeBar ? 0 : insets.top, backgroundColor: nativeBar ? APP_BG : primary }]}>
      {nativeBar && focused && <StatusBar style="dark" />}
      {nativeBar && <AppBar title={title!} subtitle={subtitle} />}
      {initialLoading && (
        <View style={[styles.loader, { backgroundColor: primary }]}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      )}
      {!initialLoading && progress > 0 && progress < 1 && (
        <View pointerEvents="none" style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        applicationNameForUserAgent={appUserAgent()}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={HIDE_SITE_NAV_JS}
        injectedJavaScript={HIDE_SITE_NAV_JS}
        onMessage={(e) => handleSiteMessage(e.nativeEvent.data)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onLoadEnd={() => { setInitialLoading(false); setProgress(0); loadedAt.current = Date.now(); }}
        // Cookie sharing — critical for twin-login
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        // Security
        originWhitelist={REGISTER.website.allowedDomains.map(d => `https://${d}`)}
        // target=_blank / window.open load in this view; without this they were dropped
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        javaScriptEnabled
        domStorageEnabled
        // UX
        pullToRefreshEnabled
        bounces={Platform.OS === 'ios'}
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  webview:   { flex: 1, backgroundColor: '#FFFFFF' },
  progress: { position: 'absolute', top: 0, left: 0, height: 3, zIndex: 11 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 8 },
  errorSub:   { fontSize: 14, color: '#6B7280' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
