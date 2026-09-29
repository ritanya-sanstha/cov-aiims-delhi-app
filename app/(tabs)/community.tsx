import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { api } from '../../lib/api';

interface Post {
  id: number;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  isPinned: boolean;
  category?: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  totalPages: number;
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await api.get<PostsResponse>('/community/posts?limit=30');
      setPosts(data.posts);
    } catch {
      // fail silently
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Board</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a56db" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, item.isPinned && styles.pinned]} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                {item.isPinned && <Text style={styles.pinnedBadge}>📌 Pinned</Text>}
                {item.category && <Text style={styles.category}>{item.category}</Text>}
              </View>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
              <View style={styles.meta}>
                <Text style={styles.author}>{item.authorName}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
        />
      )}
    </View>
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
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pinned: { borderLeftWidth: 3, borderLeftColor: '#1a56db' },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  pinnedBadge: { fontSize: 11, color: '#1a56db', fontWeight: '600' },
  category: {
    fontSize: 11,
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    fontWeight: '500',
  },
  postTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  author: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  dot: { color: '#d1d5db', fontSize: 12 },
  date: { fontSize: 12, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
