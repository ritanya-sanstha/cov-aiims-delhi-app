/**
 * src/components/AppBar.tsx — the app's own top bar for the tab screens.
 * Replaces the website's floating header (hidden by siteScripts) with the same
 * kind of floating white card: logo + title on the left; alerts, profile and
 * (for admins) admin panel on the right.
 */
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER } from '../config';
import { getSiteChrome, subscribeSiteChrome } from '../session';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const APP_BG = '#F2F3F7';
// assets/brand/logo.png is the register's logo (scripts/apply-branding.js copies it there)
const LOGO = require('../../assets/brand/logo.png');

export default function AppBar({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primaryColor } = REGISTER.branding;
  const [chrome, setChrome] = useState(getSiteChrome());
  useEffect(() => subscribeSiteChrome(setChrome), []);
  const { admin, avatar, initials } = chrome;

  const Action = ({ icon, label, path }: { icon: IoniconName; label: string; path: string }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/page', params: { path, title: label } })}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={styles.action}
    >
      <Ionicons name={icon} size={24} color="#4B5563" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={primaryColor} />
          </TouchableOpacity>
        ) : (
          <Image source={LOGO} style={styles.logo} />
        )}
        <View style={styles.titles}>
          <Text style={[styles.title, { color: primaryColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {!onBack && admin && <Action icon="shield-checkmark-outline" label="Admin panel" path="/admin" />}
        {!onBack && <Action icon="notifications-outline" label="Alerts" path="/notifications" />}
        {!onBack && (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/page', params: { path: REGISTER.website.profilePath, title: 'Profile' } })}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={styles.action}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : initials ? (
            <View style={[styles.avatar, styles.initials]}><Text style={styles.initialsText}>{initials}</Text></View>
          ) : (
            <Ionicons name="person-circle-outline" size={30} color="#4B5563" />
          )}
        </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: APP_BG, paddingHorizontal: 12, paddingBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  logo: { width: 36, height: 36, borderRadius: 18, marginRight: 4 },
  titles: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  action: { padding: 6 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4, backgroundColor: '#F2F3F7' },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  initials: { backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center', borderColor: '#0D9488' },
  initialsText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
