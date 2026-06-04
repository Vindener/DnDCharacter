import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import type { ThemeColors } from '@/shared/styles/theme';
import { rd, sp } from '@/shared/styles/tokens';

type SkeletonBoxProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type SkeletonTextProps = {
  lines?: number;
  width?: DimensionValue;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type SkeletonListProps = {
  count?: number;
  renderItem?: (index: number) => React.ReactNode;
  testID?: string;
};

function usePulse() {
  const opacity = React.useRef(new Animated.Value(0.55)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 720, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    surface: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    card: {
      borderRadius: rd(14),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: sp(12),
      gap: sp(9),
      elevation: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    wrapRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(8),
    },
    grow: {
      flex: 1,
      gap: sp(7),
    },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: sp(14),
      paddingBottom: 28,
      gap: sp(12),
    },
    list: {
      gap: sp(10),
    },
  });
}

export function SkeletonBox({ width = '100%', height = 16, radius = rd(8), style, testID }: SkeletonBoxProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const opacity = usePulse();

  return (
    <Animated.View
      testID={testID}
      style={[styles.surface, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
}

export function SkeletonText({ lines = 1, width = '100%', lastLineWidth = '70%', style, testID }: SkeletonTextProps) {
  return (
    <View testID={testID} style={[{ gap: sp(6) }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={`skeleton-text-${index}`}
          width={index === lines - 1 ? lastLineWidth : width}
          height={12}
          radius={rd(6)}
        />
      ))}
    </View>
  );
}

export function SkeletonCircle({ size = 44, style, testID }: { size?: number; style?: StyleProp<ViewStyle>; testID?: string }) {
  return <SkeletonBox testID={testID} width={size} height={size} radius={rd(999)} style={style} />;
}

export function SkeletonCard({ children, style, testID }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; testID?: string }>) {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function SkeletonList({ count = 4, renderItem, testID }: SkeletonListProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View testID={testID} style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={`skeleton-list-${index}`}>
          {renderItem ? renderItem(index) : <SkeletonCard><SkeletonText lines={3} /></SkeletonCard>}
        </React.Fragment>
      ))}
    </View>
  );
}

export function SkeletonCharacterCard() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <SkeletonCard testID='skeleton-character-card'>
      <View style={styles.row}>
        <SkeletonCircle size={44} />
        <View style={styles.grow}>
          <SkeletonText lines={2} lastLineWidth='45%' />
          <View style={styles.wrapRow}>
            <SkeletonBox width={58} height={22} radius={rd(99)} />
            <SkeletonBox width={74} height={22} radius={rd(99)} />
          </View>
        </View>
      </View>
    </SkeletonCard>
  );
}

export function SkeletonSpellCard() {
  return (
    <SkeletonCard testID='skeleton-spell-card'>
      <SkeletonText lines={2} lastLineWidth='55%' />
      <SkeletonText lines={3} lastLineWidth='80%' />
      <SkeletonBox height={34} radius={rd(10)} />
    </SkeletonCard>
  );
}

export function SkeletonMonsterCard() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <SkeletonCard testID='skeleton-monster-card'>
      <View style={styles.row}>
        <SkeletonCircle size={54} />
        <View style={styles.grow}>
          <SkeletonText lines={2} lastLineWidth='40%' />
          <View style={styles.wrapRow}>
            <SkeletonBox width={48} height={22} radius={rd(99)} />
            <SkeletonBox width={48} height={22} radius={rd(99)} />
            <SkeletonBox width={54} height={22} radius={rd(99)} />
          </View>
        </View>
      </View>
    </SkeletonCard>
  );
}

export function SkeletonHome() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <ScrollView testID='skeleton-home' style={styles.screen} contentContainerStyle={styles.content}>
      <SkeletonCard>
        <SkeletonText lines={2} lastLineWidth='62%' />
        <SkeletonBox height={44} radius={rd(12)} />
      </SkeletonCard>
      <SkeletonCard>
        <View style={styles.wrapRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBox key={`home-action-${index}`} width='48%' height={52} radius={rd(12)} />
          ))}
        </View>
      </SkeletonCard>
      <SkeletonList count={3} renderItem={() => <SkeletonCharacterCard />} />
      <SkeletonCard>
        <SkeletonText lines={3} lastLineWidth='70%' />
      </SkeletonCard>
    </ScrollView>
  );
}

export function SkeletonCharacterSheet() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <ScrollView testID='skeleton-character-sheet' style={styles.screen} contentContainerStyle={styles.content}>
      <SkeletonCard>
        <View style={styles.row}>
          <SkeletonCircle size={56} />
          <View style={styles.grow}>
            <SkeletonText lines={2} lastLineWidth='50%' />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <View style={styles.wrapRow}>
          <SkeletonBox width='31%' height={64} radius={rd(12)} />
          <SkeletonBox width='31%' height={64} radius={rd(12)} />
          <SkeletonBox width='31%' height={64} radius={rd(12)} />
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <View style={styles.wrapRow}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBox key={`tab-${index}`} width={76} height={34} radius={rd(99)} />
          ))}
        </View>
      </SkeletonCard>
      <SkeletonList count={3} renderItem={() => <SkeletonCard><SkeletonText lines={4} /></SkeletonCard>} />
    </ScrollView>
  );
}

export function SkeletonSpellbook() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View testID='skeleton-spellbook' style={styles.list}>
      <SkeletonBox height={44} radius={rd(10)} />
      <View style={styles.wrapRow}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBox key={`spell-filter-${index}`} width={92} height={34} radius={rd(99)} />
        ))}
      </View>
      <SkeletonList count={4} renderItem={() => <SkeletonSpellCard />} />
    </View>
  );
}

export function SkeletonBestiary() {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <View testID='skeleton-bestiary' style={styles.list}>
      <SkeletonCard>
        <SkeletonText lines={2} lastLineWidth='55%' />
        <SkeletonBox height={44} radius={rd(10)} />
        <View style={styles.wrapRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBox key={`monster-filter-${index}`} width='48%' height={48} radius={rd(10)} />
          ))}
        </View>
      </SkeletonCard>
      <SkeletonList count={4} renderItem={() => <SkeletonMonsterCard />} />
    </View>
  );
}
