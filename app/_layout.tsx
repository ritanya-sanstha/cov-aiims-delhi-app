import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionCtx, SessionContext } from '../lib/useSession';
import { getMe, SessionUser } from '../lib/auth';

export default function RootLayout() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading, segments]);

  const ctx: SessionContext = { user, loading, setUser };

  return (
    <SessionCtx.Provider value={ctx}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SessionCtx.Provider>
  );
}
