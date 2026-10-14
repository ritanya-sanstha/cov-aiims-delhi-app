import 'react-native-gesture-handler';
/**
 * app/_layout.tsx  — Root layout (Expo Router)
 *
 * Auth detection strategy (WebView-centric):
 *   1. On mount, fetch REGISTER.website.authCheckPath (a member-only page)
 *   2. If the response URL ended up at /login or is not OK → not logged in → (auth) stack
 *   3. Otherwise → logged in → (tabs) stack
 *
 * After login, the website sets an HttpOnly session cookie in the system WebView
 * cookie jar.  All subsequent WebViews in the app share that cookie automatically.
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { REGISTER } from '../src/config';
import { isLoggedIn } from '../src/auth';

type AuthState = 'loading' | 'loggedIn' | 'loggedOut';

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  // Same typefaces as the website. If loading fails the app still starts with the system font.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const fontsReady = fontsLoaded || !!fontError;
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

    // Only act on the launch route ("/", no segments). Any other screen
    // (login, tabs, /signout, ...) manages its own navigation.
    if (segments.length > 0) return;

    router.replace(authState === 'loggedIn' ? '/(tabs)/home' : '/(auth)/login');
  }, [authState, segments, navState?.key]);

  async function checkAuthState() {
    // Don't let a slow server hold the launch screen: after 5s give up and
    // show the login WebView, which handles everything itself.
    setAuthState((await isLoggedIn(5000)) ? 'loggedIn' : 'loggedOut');
  }

  if (authState === 'loading' || !fontsReady) {
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
