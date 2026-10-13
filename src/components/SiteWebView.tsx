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
import { Ionicons } from '@expo/vector-icons';
import { REGISTER, siteUrl, isAllowedUrl } from '../config';

interface Props {
  path: string;        // e.g. '/dashboard', '/helpline'
  /** Optional: scroll-up when tab is tapped again (default true) */
  scrollToTopOnFocus?: boolean;
}

export default function SiteWebView({ path }: Props) {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  // Full-screen spinner only for the very first load; later navigations show
  // a thin progress bar so the page stays visible and taps feel instant.
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const url = siteUrl(path);

  const primary = REGISTER.branding.primaryColor;
  const accent  = REGISTER.branding.accentColor;

  // Android hardware back button — navigate WebView back if possible
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        webViewRef.current?.goBack();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  function handleNavigationStateChange(navState: WebViewNavigation) {
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
        contentContainerStyle={[styles.center, { backgroundColor: '#F0F2F5' }]}
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
    <View style={styles.container}>
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
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onLoadEnd={() => { setInitialLoading(false); setProgress(0); }}
        // Cookie sharing — critical for twin-login
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        // Security
        originWhitelist={REGISTER.website.allowedDomains.map(d => `https://${d}`)}
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
  webview:   { flex: 1 },
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
