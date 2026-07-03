import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { Card, Screen, Text } from '@/shared/ui';
import type { ThemeColors } from '@/shared/styles/theme';
import { fs, rd, sp } from '@/shared/styles/tokens';

const LEGAL_SOURCE_LINKS = [
  { labelKey: 'sources.srdOglPdf', url: 'https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf' },
  { labelKey: 'sources.srdFaq', url: 'https://www.dndbeyond.com/srd' },
];

const LegalLicenses = () => {
  const { t } = useTranslation('legal');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const openSource = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.card}>
        <Text variant='title' weight='bold'>{t('title')}</Text>
        <Text tone='secondary' style={styles.body}>{t('intro')}</Text>
      </Card>

      <Card style={styles.card}>
        <Text variant='subtitle' weight='bold'>{t('sections.srd.title')}</Text>
        <Text tone='secondary' style={styles.body}>{t('sections.srd.body')}</Text>
      </Card>

      <Card style={styles.card}>
        <Text variant='subtitle' weight='bold'>{t('sections.productIdentity.title')}</Text>
        <Text tone='secondary' style={styles.body}>{t('sections.productIdentity.body')}</Text>
      </Card>

      <Card style={styles.card}>
        <Text variant='subtitle' weight='bold'>{t('sections.notice.title')}</Text>
        <Text tone='secondary' style={styles.notice}>{t('sections.notice.ogl')}</Text>
        <Text tone='secondary' style={styles.notice}>{t('sections.notice.srd')}</Text>
        <Text tone='secondary' style={styles.body}>{t('sections.notice.placeholder')}</Text>
      </Card>

      <Card style={styles.card}>
        <Text variant='subtitle' weight='bold'>{t('sources.title')}</Text>
        <View style={styles.links}>
          {LEGAL_SOURCE_LINKS.map((source) => (
            <Pressable
              key={source.url}
              accessibilityRole='link'
              android_ripple={{ color: colors.ripple }}
              onPress={() => openSource(source.url)}
              style={styles.linkButton}
            >
              <Text weight='bold' style={styles.linkText}>{t(source.labelKey)}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
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
    notice: {
      fontSize: fs(12),
      lineHeight: 18,
    },
    links: {
      gap: sp(8),
    },
    linkButton: {
      minHeight: 44,
      borderRadius: rd(10),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      justifyContent: 'center',
      paddingHorizontal: sp(12),
      paddingVertical: sp(10),
    },
    linkText: {
      color: c.brand,
      fontSize: fs(13),
    },
  });

export default LegalLicenses;
