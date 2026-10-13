/**
 * src/components/AppBar.tsx — the app's own top bar for the tab screens.
 * Replaces the website's floating header (hidden by siteScripts): screen title
 * on the left; alerts, profile and (for admins) admin panel on the right.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER } from '../config';
import { getSiteAdmin, subscribeSiteAdmin } from '../session';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AppBar({ title }: { title: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { primaryColor, accentColor } = REGISTER.branding;
  const [admin, setAdmin] = useState(getSiteAdmin());
  useEffect(() => subscribeSiteAdmin(setAdmin), []);

  const open = (path: string, label: string) => () =>
    router.push({ pathname: '/page', params: { path, title: label } });

  const Action = ({ icon, label, path }: { icon: IoniconName; label: string; path: string }) => (
    <TouchableOpacity
      onPress={open(path, label)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={styles.action}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6, backgroundColor: primaryColor }]}>
      <View style={[styles.mark, { backgroundColor: accentColor }]} />
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {admin && <Action icon="shield-checkmark-outline" label="Admin panel" path="/admin" />}
      <Action icon="notifications-outline" label="Alerts" path="/notifications" />
      <Action icon="person-circle-outline" label="Profile" path={REGISTER.website.profilePath} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, gap: 4 },
  mark: { width: 4, height: 20, borderRadius: 2, marginRight: 8 },
  title: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  action: { padding: 6 },
});
