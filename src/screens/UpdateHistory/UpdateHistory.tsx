import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { Card, Screen, Text } from '@/shared/ui';
import type { ThemeColors } from '@/shared/styles/theme';
import { fs, sp } from '@/shared/styles/tokens';

type VersionEntry = {
  version: string;
  items: string[];
};

const UpdateHistory = () => {
  const { t } = useTranslation('changeHistory');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const versions = t('versions', { returnObjects: true });
  const versionList = Array.isArray(versions) ? (versions as VersionEntry[]) : [];

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.card}>
        <Text variant='title' weight='bold'>
          {t('title')}
        </Text>
        <Text tone='secondary' style={styles.body}>
          {t('intro')}
        </Text>
      </Card>

      {versionList.map((entry) => (
        <Card key={entry.version} style={styles.card}>
          <Text variant='subtitle' weight='bold'>
            {entry.version}
          </Text>
          {entry.items.map((item) => (
            <Text key={item} tone='secondary' style={styles.item}>
              {'• '}
              {item}
            </Text>
          ))}
        </Card>
      ))}
    </Screen>
  );
};

const getStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      gap: sp(12),
      paddingBottom: sp(28),
    },
    card: {
      gap: sp(8),
    },
    body: {
      fontSize: fs(13),
      lineHeight: 19,
    },
    item: {
      fontSize: fs(13),
      lineHeight: 19,
      color: c.textSecondary,
    },
  });

export default UpdateHistory;
