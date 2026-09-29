import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { api } from '../../lib/api';

interface Member {
  id: number;
  name: string;
  email: string;
  specialty?: string;
  batchYear?: number;
  profilePhoto?: string;
  role: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
}

export default function DirectoryScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(q: string, p: number, reset = false) {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (q) params.set('search', q);
      const data = await api.get<MembersResponse>(`/members?${params}`);
      setMembers(reset ? data.members : (prev) => [...prev, ...data.members]);
      setTotalPages(data.totalPages);
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    setLoading(true);
    load(search, 1, true).finally(() => setLoading(false));
    setPage(1);
  }, [search]);

  async function loadMore() {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await load(search, next, false);
    setPage(next);
    setLoadingMore(false);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Member Directory</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <MemberRow member={item} />}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#1a56db" /> : null}
          ListEmptyComponent={
            <Text style={styles.empty}>No members found.</Text>
          }
        />
      )}
    </View>
  );
}

function MemberRow({ member }: { member: Member }) {
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.avatar}>
        {member.profilePhoto ? (
          <Image source={{ uri: member.profilePhoto }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>
          {[member.specialty, member.batchYear ? `Batch ${member.batchYear}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#111827',
  },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#1a56db' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
