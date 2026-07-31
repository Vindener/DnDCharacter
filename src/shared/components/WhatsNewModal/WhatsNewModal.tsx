import React from 'react';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { Modal } from '@/shared/components/Modal/Modal';
import { Text, Button } from '@/shared/ui';
import { getLastSeenWhatsNewVersion, setLastSeenWhatsNewVersion } from '@/repositories/whatsNewRepository';
import { styles } from '@/shared/components/WhatsNewModal/style';

// Shown once per app version bump (native release or OTA update via `eas update`).
// A fresh install records the current version as the baseline without showing the modal.
const WhatsNewModal: React.FC = () => {
  const { t } = useTranslation('whatsNew');
  const [isVisible, setIsVisible] = React.useState(false);
  const [version, setVersion] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      const currentVersion = Constants.expoConfig?.version;
      if (!currentVersion) return;

      const lastSeenVersion = await getLastSeenWhatsNewVersion();
      if (cancelled) return;

      if (lastSeenVersion === null) {
        await setLastSeenWhatsNewVersion(currentVersion);
        return;
      }

      if (lastSeenVersion !== currentVersion) {
        setVersion(currentVersion);
        setIsVisible(true);
      }
    }

    void checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAcknowledge = () => {
    setIsVisible(false);
    if (version) void setLastSeenWhatsNewVersion(version);
  };

  const items = t('items', { returnObjects: true });
  const itemList = Array.isArray(items) ? (items as string[]) : [];

  return (
    <Modal title={t('title', { version })} isVisible={isVisible} onClose={handleAcknowledge}>
      <Text variant='body' style={styles.intro}>
        {t('intro')}
      </Text>
      {itemList.map((item) => (
        <Text key={item} variant='body' tone='secondary' style={styles.item}>
          {'• '}
          {item}
        </Text>
      ))}
      <Button title={t('gotIt')} variant='primary' onPress={handleAcknowledge} style={styles.action} />
    </Modal>
  );
};

export default WhatsNewModal;
