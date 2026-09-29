import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSession } from '../../lib/useSession';
import { logout } from '../../lib/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, setUser } = useSession();
  const router = useRouter();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setUser(null);
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.status === 'verified' && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Member</Text>
          </View>
        )}
      </View>

      {/* Details section */}
      <Text style={styles.sectionHeader}>PROFILE DETAILS</Text>
      <View style={styles.sectionCard}>
        <SectionRow label="Email" value={user.email} />
        {user.phone && <SectionRow label="Phone" value={user.phone} />}
        {user.batchYear && <SectionRow label="Batch Year" value={String(user.batchYear)} />}
        {user.specialty && <SectionRow label="Specialty" value={user.specialty} />}
        {user.memberId && (
          <SectionRow label="Member ID" value={String(user.memberId)} last />
        )}
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <View style={styles.sectionCard}>
        <SectionRow label="Role" value={user.role.replace(/_/g, ' ').replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1))} />
        <SectionRow
          label="Status"
          value={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          last
        />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut} activeOpacity={0.7}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>COV – AIIMS Delhi Alumni App{'\n'}v1.0.0</Text>
    </ScrollView>
  );
}

function SectionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#1a56db' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  verifiedText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9b9b9b',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 15, color: '#374151' },
  rowValue: { fontSize: 15, color: '#6b7280', maxWidth: '60%', textAlign: 'right' },
  signOutBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 8,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  footer: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 },
});
