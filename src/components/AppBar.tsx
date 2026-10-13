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
import { getSiteAdmin, subscribeSiteAdmin } from '../session';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const APP_BG = '#F2F3F7';
const LOGO = require('../../assets/logos/aiims-delhi-logo.png');

export default function AppBar({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primaryColor } = REGISTER.branding;
  const [admin, setAdmin] = useState(getSiteAdmin());
  useEffect(() => subscribeSiteAdmin(setAdmin), []);

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
        <Image source={LOGO} style={styles.logo} />
        <Text style={[styles.title, { color: primaryColor }]} numberOfLines={1}>{title}</Text>
        {admin && <Action icon="shield-checkmark-outline" label="Admin panel" path="/admin" />}
        <Action icon="notifications-outline" label="Alerts" path="/notifications" />
        <Action icon="person-circle-outline" label="Profile" path={REGISTER.website.profilePath} />
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
  title: { flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  action: { padding: 6 },
});
