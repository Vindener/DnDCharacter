import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal/Modal';
import { Text, Button } from '@/shared/ui';
import useThemeStore from '@/context/Theme-store';
import { getHasSeenFirstLaunchIntro, setHasSeenFirstLaunchIntro } from '@/repositories/firstLaunchRepository';
import { styles } from '@/shared/components/FirstLaunchModals/style';

type Step = 'hidden' | 'development' | 'analytics' | 'thanks';

// Shown once on the very first launch: a development-status notice, then an analytics
// consent question (CLAUDE.md §8.1 — opt-in, off by default until the user says yes here
// or later in Settings).
const FirstLaunchModals: React.FC = () => {
  const { t } = useTranslation('firstLaunch');
  const [step, setStep] = React.useState<Step>('hidden');
  const setAnalyticsConsent = useThemeStore((s) => s.setAnalyticsConsent);

  React.useEffect(() => {
    let cancelled = false;

    async function checkFirstLaunch() {
      const hasSeen = await getHasSeenFirstLaunchIntro();
      if (!cancelled && !hasSeen) setStep('development');
    }

    void checkFirstLaunch();

    return () => {
      cancelled = true;
    };
  }, []);

  const finish = () => {
    setStep('hidden');
    void setHasSeenFirstLaunchIntro();
  };

  const handleConsent = (accepted: boolean) => {
    void setAnalyticsConsent(accepted);
    if (accepted) {
      setStep('thanks');
    } else {
      finish();
    }
  };

  if (step === 'development') {
    return (
      <Modal title={t('development.title')} isVisible onClose={() => setStep('analytics')}>
        <Text variant='body' style={styles.body}>
          {t('development.body')}
        </Text>
        <Button title={t('development.action')} variant='primary' onPress={() => setStep('analytics')} style={styles.action} />
      </Modal>
    );
  }

  if (step === 'analytics') {
    return (
      <Modal title={t('analytics.title')} isVisible onClose={() => handleConsent(false)}>
        <Text variant='body' style={styles.body}>
          {t('analytics.body')}
        </Text>
        <View style={styles.actionsRow}>
          <Button title={t('analytics.decline')} variant='ghost' onPress={() => handleConsent(false)} style={styles.actionHalf} />
          <Button title={t('analytics.accept')} variant='primary' onPress={() => handleConsent(true)} style={styles.actionHalf} />
        </View>
      </Modal>
    );
  }

  if (step === 'thanks') {
    return (
      <Modal title={t('thanks.title')} isVisible onClose={finish}>
        <Text variant='body' style={styles.body}>
          {t('thanks.body')}
        </Text>
        <Button title={t('thanks.action')} variant='primary' onPress={finish} style={styles.action} />
      </Modal>
    );
  }

  return null;
};

export default FirstLaunchModals;
