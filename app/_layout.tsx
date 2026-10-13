import 'react-native-gesture-handler';
/**
 * app/_layout.tsx  — Root layout (Expo Router)
 *
 * Auth detection strategy (WebView-centric):
 *   1. On mount, do a lightweight HEAD request to baseUrl/dashboard
 *   2. If response URL ended up at /login  → user is not logged in → show (auth) stack
 *   3. If response URL stayed at /dashboard → user is logged in  → show (tabs) stack
 *
 * After login, the website sets an HttpOnly session cookie in the system WebView
 * cookie jar.  All subsequent WebViews in the app share that cookie automatically.
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { REGISTER, siteUrl } from '../src/config';

type AuthState = 'loading' | 'loggedIn' | 'loggedOut';

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    checkAuthState();
  }, []);

  // Initial redirect only: from the launch route ("/") into (auth) or (tabs).
  // Wait for the navigator to be ready, otherwise router.replace is ignored.
  // After that, the login screen navigates to the tabs itself.
  useEffect(() => {
    if (authState === 'loading' || !navState?.key) return;

    const group = segments[0];
    if (group === '(auth)' || group === '(tabs)') return;

    router.replace(authState === 'loggedIn' ? '/(tabs)/home' : '/(auth)/login');
  }, [authState, segments, navState?.key]);

  async function checkAuthState() {
    // Don't let a slow server hold the launch screen: after 5s give up and
    // show the login WebView, which handles everything itself.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      // Ping the dashboard — the server will redirect to /login if not authed
      const res = await fetch(siteUrl('/dashboard'), {
        method: 'GET',
        redirect: 'follow',
        credentials: 'include',
        headers: { 'Accept': 'text/html' },
        signal: controller.signal,
      });
      const finalUrl = res.url ?? '';
      const isLogin = finalUrl.includes(REGISTER.website.loginPath);
      // A 404/5xx (e.g. page not deployed) must not count as "logged in".
      setAuthState(res.ok && !isLogin ? 'loggedIn' : 'loggedOut');
    } catch {
      // Network error or timeout → let the login WebView handle it
      setAuthState('loggedOut');
    } finally {
      clearTimeout(timer);
    }
  }

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: REGISTER.branding.splashBg, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={REGISTER.branding.statusBarStyle} />
        <ActivityIndicator size="large" color={REGISTER.branding.accentColor} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={REGISTER.branding.statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
