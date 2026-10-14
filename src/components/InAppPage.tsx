/**
 * src/components/InAppPage.tsx — one website page inside the app, with a Back
 * button. Used by the More menu (app/page.tsx) and for website links opened
 * from outside the app (app/[...path].tsx).
 */
import { useCallback, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { REGISTER, siteUrl, isAllowedUrl } from '../config';
import { appUserAgent, handleSiteMessage, siteInjectedScript } from '../siteScripts';
import AppBar, { APP_BG } from './AppBar';

const HIDE_SITE_NAV_JS = siteInjectedScript();

export default function InAppPage({ path, title }: { path: string; title?: string }) {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const canGoBack = useRef(false);

  // Opened from a link there may be nothing to go back to: go to the app's home.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Phone Back: go back inside the page first, then leave the screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (Platform.OS !== 'android') return () => setFocused(false);
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack.current) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => { sub.remove(); setFocused(false); };
    }, [])
  );

  return (
    <View style={styles.container}>
      {focused && <StatusBar style="dark" />}
      <AppBar title={title ?? REGISTER.institute.shortName} onBack={goBack} />
      <WebView
        ref={webViewRef}
        onNavigationStateChange={(n: WebViewNavigation) => {
          canGoBack.current = n.canGoBack;
          // session expired (the website sent us to its login page): use the app's login screen
          if (n.url && n.url.includes(REGISTER.website.loginPath)) router.replace('/(auth)/login');
        }}
        source={{ uri: siteUrl(path || '/') }}
        applicationNameForUserAgent={appUserAgent()}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={HIDE_SITE_NAV_JS}
        injectedJavaScript={HIDE_SITE_NAV_JS}
        onMessage={(e) => handleSiteMessage(e.nativeEvent.data)}
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
  webview: { flex: 1, backgroundColor: '#fff' },
});
