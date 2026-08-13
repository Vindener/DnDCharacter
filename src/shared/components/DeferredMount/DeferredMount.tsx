import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, StyleSheet, View } from 'react-native';
import useThemeStore from '@/context/Theme-store';

interface DeferredMountProps {
  children: React.ReactNode;
}

// Gives the tap that opens a heavy screen (Character/Bestiary/Spellbook) an instant visual
// response — a spinner paints on the very next frame — instead of the navigation transition
// stalling on that screen's first render (mounting its own skeleton + kicking off data/SRD
// loading) before anything shows up at all. Renders `children` only after the current
// interaction (the transition) has settled, so the heavy component's first render lands in
// its own commit, after the spinner is already on screen.
export function DeferredMount({ children }: DeferredMountProps) {
  const colors = useThemeStore((s) => s.colors);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} testID='deferredMount.loading'>
        <ActivityIndicator size='large' color={colors.text} testID='deferredMount.spinner' />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DeferredMount;
