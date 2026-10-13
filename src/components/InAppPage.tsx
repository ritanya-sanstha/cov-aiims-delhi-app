/**
 * src/components/InAppPage.tsx — one website page inside the app, with a Back
 * button. Used by the More menu (app/page.tsx) and for website links opened
 * from outside the app (app/[...path].tsx).
 */
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { REGISTER, siteUrl, isAllowedUrl } from '../config';
import { hideSiteBottomNavScript } from '../siteScripts';

const HIDE_SITE_NAV_JS = hideSiteBottomNavScript();

export default function InAppPage({ path, title }: { path: string; title?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primaryColor, accentColor } = REGISTER.branding;

  // Opened from a link there may be nothing to go back to: go to the app's home.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { paddingTop: insets.top + 8, backgroundColor: primaryColor }]}>
        <TouchableOpacity onPress={goBack} accessibilityRole="button">
          <Text style={[styles.back, { color: accentColor }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title ?? REGISTER.institute.shortName}</Text>
        <View style={styles.spacer} />
      </View>
      <WebView
        source={{ uri: siteUrl(path || '/') }}
        style={styles.webview}
        injectedJavaScript={HIDE_SITE_NAV_JS}
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
  back: { fontSize: 17, fontWeight: '600', width: 64 },
  title: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  spacer: { width: 64 },
  webview: { flex: 1 },
});
