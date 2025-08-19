// app/(tabs)/profile.js
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebase';           // <-- db exported from firebase.js
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // <-- Firestore

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  // Firestore user fields
  const [profileName, setProfileName] = useState('');
  const [profileID, setProfileID] = useState(null); // your field is "ID" (uppercase)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) router.replace('/login');
    });
    return unsubAuth;
  }, [router]);

  // Subscribe to Firestore users/{uid}
  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid);
    const unsubDoc = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfileName(data?.name ?? '');
          setProfileID(data?.ID ?? null); // IMPORTANT: "ID" matches your screenshot
        }
      },
      (err) => console.error('users doc error:', err)
    );
    return unsubDoc;
  }, [user?.uid]);

  const initials = useMemo(() => {
    const nm = (profileName || user?.displayName || user?.email || '');
    const parts = nm.split('@')[0].split(/[.\s_-]+/).filter(Boolean);
    const a = parts[0]?.[0]?.toUpperCase() ?? '';
    const b = parts[1]?.[0]?.toUpperCase() ?? '';
    return (a + b) || 'U';
  }, [profileName, user]);

  const handleLogout = async () => {
    try { await signOut(auth); }
    catch (e) { Alert.alert('Logout failed', e?.message ?? 'Please try again.'); }
  };

  const reloadUser = async () => {
    try {
      setLoading(true);
      await user?.reload();
      setUser(auth.currentUser);
    } catch (e) {
      Alert.alert('Refresh failed', e?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) return null;

  const meta = user.metadata || {};
  const providers = user.providerData || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header / Avatar */}
      <View style={styles.headerCard}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profileName || user.displayName || 'No display name'}</Text>
          <Text style={styles.email}>{user.email || 'No email'}</Text>
        </View>
      </View>

      {/* Primary Info */}
      <View style={styles.card}>
        <Row label="UID" value={user.uid} mono />
        <Row label="Profile ID" value={profileID ?? '—'} />
        <Row label="Email verified" value={String(!!user.emailVerified)} />
        <Row label="Phone" value={user.phoneNumber || '—'} />
        <Row label="Provider(s)" value={providers.map(p => p.providerId).join(', ') || '—'} />
        <Row label="Last sign-in" value={meta.lastSignInTime || '—'} />
        <Row label="Created" value={meta.creationTime || '—'} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={reloadUser}>
          <Text style={[styles.buttonText, styles.secondaryText]}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, mono }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={2}>
        {String(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 16 },
  headerCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#334155' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 14, color: '#475569', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 2 },
  row: { flexDirection: 'row', paddingVertical: 10, gap: 10 },
  rowLabel: { width: 130, color: '#64748b', fontWeight: '600' },
  rowValue: { flex: 1, color: '#0f172a' },
  mono: { fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: '#f1f5f9' },
  secondaryText: { color: '#0f172a' },
  danger: { backgroundColor: '#ef4444' },
  buttonText: { color: 'white', fontWeight: '700' },
});
