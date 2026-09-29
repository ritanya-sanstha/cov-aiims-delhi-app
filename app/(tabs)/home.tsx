import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../lib/useSession';
import { api } from '../../lib/api';

interface Stats {
  totalMembers: number;
  verifiedMembers: number;
  recentAnnouncements: number;
}

export default function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await api.get<Stats>('/dashboard/stats');
      setStats(data);
    } catch {
      // fail silently — offline or network issue
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingSmall}>Welcome back,</Text>
        <Text style={styles.greetingName}>{user?.name?.split(' ')[0] ?? 'Member'} 👋</Text>
        <Text style={styles.greetingOrg}>COV – AIIMS Delhi</Text>
      </View>

      {/* Stats row */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="Total Members" value={String(stats.totalMembers)} emoji="👥" />
          <StatCard label="Verified" value={String(stats.verifiedMembers)} emoji="✅" />
          <StatCard label="Announcements" value={String(stats.recentAnnouncements)} emoji="📢" />
        </View>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        <QuickCard emoji="👥" label="Member Directory" onPress={() => router.push('/(tabs)/directory')} />
        <QuickCard emoji="🪪" label="My Digital ID" onPress={() => router.push('/(tabs)/idcard')} />
        <QuickCard emoji="💬" label="Community Board" onPress={() => router.push('/(tabs)/community')} />
        <QuickCard emoji="👤" label="My Profile" onPress={() => router.push('/(tabs)/profile')} />
        {isAdmin && (
          <QuickCard emoji="⚙️" label="Admin Panel" onPress={() => {}} />
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickCard({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  greeting: { marginBottom: 24 },
  greetingSmall: { fontSize: 13, color: '#6b7280' },
  greetingName: { fontSize: 26, fontWeight: '700', color: '#111827', marginTop: 2 },
  greetingOrg: { fontSize: 13, color: '#1a56db', marginTop: 2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '500', color: '#374151', textAlign: 'center' },
});
