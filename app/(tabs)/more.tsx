/**
 * app/(tabs)/more.tsx — native "More" screen (the website has no /more page).
 * Everything shown comes from the register; look: docs/DESIGN.md.
 */
import { useCallback, useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { REGISTER } from '../../src/config';
import AppBar, { APP_BG } from '../../src/components/AppBar';
import { colors, fonts, shadow } from '../../src/theme';
import { getSiteChrome } from '../../src/session';
import { inviteLink } from '../../src/api';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function Tile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon as IoniconName} size={21} color={colors.primary} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, !last && styles.rowLine]} onPress={onPress} accessibilityRole="button">
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { institute, standard, website, navigation } = REGISTER;
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const version = Constants.expoConfig?.version ?? '';
  const openPage = (path: string, title: string) => () => router.push({ pathname: '/page', params: { path, title } });

  // Phone share sheet with the member's own invite link (replaces the website's floating button).
  const invite = () => {
    const link = inviteLink(getSiteChrome().referralCode);
    const message = `Hey! Join ${institute.name}, the community of ${institute.shortName} alumni. Use my link to register: ${link}`;
    Share.share({ message }).catch(() => {});
  };

  const tiles = navigation.more.filter((m) => m.group !== 'list');
  const listed = navigation.more.filter((m) => m.group === 'list');

  return (
    <View style={styles.screen}>
      {focused && <StatusBar style="dark" />}
      <AppBar title="More" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{institute.shortName}</Text>
          {!!standard.programName && <Text style={styles.headerStrong}>{standard.programName}</Text>}
          {!!institute.tagline && <Text style={styles.headerText}>{institute.tagline}</Text>}
        </View>

        <View style={styles.grid}>
          {tiles.map((item) => (
            <Tile key={item.path} icon={item.icon} label={item.label} onPress={openPage(item.path, item.label)} />
          ))}
          <Tile icon="share-social-outline" label="Invite a batchmate" onPress={invite} />
        </View>

        <View style={styles.card}>
          {listed.map((item) => (
            <Row key={item.path} label={item.label} onPress={openPage(item.path, item.label)} />
          ))}
          {!!website.contactEmail && (
            <Row
              label="Contact us"
              last
              onPress={() => { Linking.openURL(`mailto:${website.contactEmail}`).catch(() => {}); }}
            />
          )}
        </View>

        <TouchableOpacity style={styles.signOut} onPress={() => router.push('/signout')} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={colors.alert} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          {!!standard.tagline1 && <Text style={styles.tagline}>{standard.tagline1}</Text>}
          <Text style={styles.small}>
            {[standard.poweredBy ? `Powered by ${standard.poweredBy}` : '', version ? `Version ${version}` : ''].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 24, gap: 14 },
  header: { backgroundColor: colors.surface, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 2, ...shadow.card },
  title: { fontFamily: fonts.title, fontSize: 20, letterSpacing: -0.3, color: colors.primary },
  headerStrong: { fontFamily: fonts.semibold, fontSize: 13, color: '#374151' },
  headerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31.5%',
    flexGrow: 1,
    minHeight: 86,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card,
  },
  tileIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 16 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  signOut: { minHeight: 48, borderRadius: 16, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow.card },
  signOutText: { fontFamily: fonts.bold, fontSize: 15, color: colors.alert },
  footer: { alignItems: 'center', gap: 3, paddingTop: 2 },
  tagline: { fontFamily: fonts.regular, fontSize: 13, color: '#4B5563', textAlign: 'center' },
  small: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, textAlign: 'center' },
});
