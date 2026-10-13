/**
 * app/(tabs)/more.tsx — native "More" screen (the website has no /more page).
 * Everything shown comes from the Register Artifact.
 */
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { REGISTER, siteUrl } from '../../src/config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function Row({ icon, label, onPress, external = true }: { icon: IoniconName; label: string; onPress: () => void; external?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={REGISTER.branding.primaryColor} />
      <Text style={styles.rowLabel}>{label}</Text>
      {external && <Ionicons name="open-outline" size={18} color="#9CA3AF" />}
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { institute, standard, branding, website, navigation } = REGISTER;
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '';
  const open = (path: string) => () => { Linking.openURL(siteUrl(path)).catch(() => {}); };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: branding.primaryColor }]}>
        <Text style={[styles.title, { color: branding.accentColor }]}>{institute.name}</Text>
        {!!institute.tagline && <Text style={styles.headerText}>{institute.tagline}</Text>}
        {!!institute.description && <Text style={styles.headerSub}>{institute.description}</Text>}
      </View>

      <View style={styles.card}>
        {navigation.more.map((item) => (
          <Row
            key={item.path}
            icon={item.icon as IoniconName}
            label={item.label}
            external={false}
            onPress={() => router.push({ pathname: '/page', params: { path: item.path, title: item.label } })}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Row icon="globe-outline" label="Open website in browser" onPress={open('/')} />
        <Row icon="log-in-outline" label="Open login page in browser" onPress={open(website.loginPath)} />
        <Row icon="log-out-outline" label="Sign out" external={false} onPress={() => router.push('/signout')} />
      </View>

      <View style={styles.footer}>
        {!!standard.tagline1 && <Text style={styles.tagline}>{standard.tagline1}</Text>}
        {!!standard.tagline2 && <Text style={styles.tagline}>{standard.tagline2}</Text>}
        {!!standard.poweredBy && <Text style={styles.small}>Powered by {standard.poweredBy}</Text>}
        {!!version && <Text style={styles.small}>Version {version}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F2F5' },
  content: { paddingBottom: 32 },
  header: { padding: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700' },
  headerText: { color: '#FFFFFF', fontSize: 15, marginTop: 4 },
  headerSub: { color: '#D1D5DB', fontSize: 13, marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  rowLabel: { flex: 1, fontSize: 16, color: '#111827' },
  footer: { alignItems: 'center', paddingHorizontal: 16, gap: 4 },
  tagline: { fontSize: 13, color: '#4B5563', textAlign: 'center' },
  small: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
