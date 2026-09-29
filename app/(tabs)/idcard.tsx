import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
} from 'react-native';
import { useSession } from '../../lib/useSession';
import { API_BASE } from '../../lib/api';

export default function IdCardScreen() {
  const { user } = useSession();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    core_volunteer: 'Core Volunteer',
    member: 'Member',
  };

  async function shareCard() {
    await Share.share({
      message: `${user?.name} | COV – AIIMS Delhi Alumni\nMember ID: ${user?.memberId ?? user?.id}\nVerified Member ✓`,
      title: 'My COV – AIIMS Delhi ID',
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Digital ID Card</Text>

      {/* Card */}
      <View style={styles.card}>
        {/* Card header band */}
        <View style={styles.cardHeader}>
          <Text style={styles.orgName}>Ritanya Sanstha</Text>
          <Text style={styles.cardTitle}>COV – AIIMS Delhi</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {user.status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Name + role */}
        <Text style={styles.memberName}>{user.name}</Text>
        <Text style={styles.memberRole}>{roleLabel[user.role] ?? user.role}</Text>

        {/* Details */}
        <View style={styles.details}>
          {user.memberId && (
            <DetailRow label="Member ID" value={String(user.memberId)} />
          )}
          {user.batchYear && (
            <DetailRow label="Batch Year" value={String(user.batchYear)} />
          )}
          {user.specialty && (
            <DetailRow label="Specialty" value={user.specialty} />
          )}
          <DetailRow label="Email" value={user.email} />
          {user.phone && <DetailRow label="Phone" value={user.phone} />}
          <DetailRow
            label="Status"
            value={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            highlight={user.status === 'verified'}
          />
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>aiimsdelhi.ritanyasanstha.in</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={shareCard} activeOpacity={0.8}>
        <Text style={styles.shareBtnText}>Share My ID Card</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueGreen]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56, alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', alignSelf: 'flex-start', marginBottom: 20 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  cardHeader: {
    backgroundColor: '#1a56db',
    padding: 20,
    alignItems: 'center',
  },
  orgName: { fontSize: 11, color: '#bfdbfe', letterSpacing: 1.5, textTransform: 'uppercase' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: -36,
    position: 'relative',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarInitials: { fontSize: 24, fontWeight: '700', color: '#1a56db' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 20,
  },
  memberRole: {
    fontSize: 13,
    color: '#1a56db',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: { fontSize: 13, color: '#6b7280' },
  detailValue: { fontSize: 13, fontWeight: '500', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  detailValueGreen: { color: '#16a34a' },
  cardFooter: {
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  footerText: { fontSize: 11, color: '#9ca3af' },
  shareBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
