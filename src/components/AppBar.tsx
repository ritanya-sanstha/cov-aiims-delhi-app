/**
 * src/components/AppBar.tsx — the app's own top bar (floating white card).
 * Tab screens: logo + institute/screen title + alerts, profile and (admins) admin panel.
 * Pages opened from there: a Back chevron instead of the logo and actions.
 * Look: docs/DESIGN.md.
 */
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER } from '../config';
import { getSiteChrome, subscribeSiteChrome } from '../session';
import { colors, fonts, shadow } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const APP_BG = colors.ground;
// assets/brand/logo.png is the register's logo (scripts/apply-branding.js copies it there)
const LOGO = require('../../assets/brand/logo.png');

export default function AppBar({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chrome, setChrome] = useState(getSiteChrome());
  useEffect(() => subscribeSiteChrome(setChrome), []);
  const { admin, avatar, initials } = chrome;

  const open = (path: string, label: string) =>
    router.push({ pathname: '/page', params: { path, title: label } });

  const Action = ({ icon, label, path }: { icon: IoniconName; label: string; path: string }) => (
    <TouchableOpacity
      onPress={() => open(path, label)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.action}
    >
      <Ionicons name={icon} size={24} color="#4B5563" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <Image source={LOGO} style={styles.logo} />
        )}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {!onBack && admin && <Action icon="shield-checkmark-outline" label="Admin panel" path="/admin" />}
        {!onBack && <Action icon="notifications-outline" label="Alerts" path="/notifications" />}
        {!onBack && (
          <TouchableOpacity
            onPress={() => open(REGISTER.website.profilePath, 'Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={styles.action}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initials]}>
                <Text style={styles.initialsText}>{initials || ''}</Text>
              </View>
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    ...shadow.bar,
  },
  logo: { width: 36, height: 36, borderRadius: 18, marginRight: 6 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginVertical: -4, marginLeft: -4, marginRight: 4, backgroundColor: colors.ground },
  titles: { flex: 1 },
  title: { fontFamily: fonts.title, fontSize: 18, letterSpacing: -0.2, color: colors.primary },
  subtitle: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  initials: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: fonts.bold, color: '#FFFFFF', fontSize: 13 },
});
