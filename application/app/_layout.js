// app/layout.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function RootLayout() {
  const [user, setUser] = useState(auth.currentUser);
  const [initializing, setInitializing] = useState(!auth.currentUser);
  const router = useRouter();
  const segments = useSegments(); // e.g. ['(tabs)','profile'] or ['login']

  // 1) Subscribe to Firebase auth once
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, [initializing]);

  // 2) Redirect ONLY in an effect (not during render)
  useEffect(() => {
    if (initializing) return;

    const inTabs = segments[0] === '(tabs)'; // are we inside the protected group?

    if (user && !inTabs) {
      // logged in but outside tabs -> go to tabs
      router.replace('/(tabs)');
    } else if (!user && inTabs) {
      // not logged in but in tabs -> send to login
      router.replace('/login');
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render the current route; redirects are handled by the effect above
  return <Slot />;
}
