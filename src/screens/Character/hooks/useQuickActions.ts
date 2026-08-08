import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type UseQuickActionsParams = {
  tempHp: number;
  applyHpDelta: (delta: number) => void;
  openHpModal: () => void;
  startShortRestFlow: () => void;
  applyLongRest: () => void;
  setTempShieldInput: (value: string) => void;
  setIsTempHpModalVisible: (value: boolean) => void;
  openDiceRoller: () => void;
  setIsConditionModalVisible: (value: boolean) => void;
  setIsQuickNoteModalVisible: (value: boolean) => void;
};

export type QuickActionItem = {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
};

export function useQuickActions({
  tempHp,
  applyHpDelta,
  openHpModal,
  startShortRestFlow,
  applyLongRest,
  setTempShieldInput,
  setIsTempHpModalVisible,
  openDiceRoller,
  setIsConditionModalVisible,
  setIsQuickNoteModalVisible,
}: UseQuickActionsParams): QuickActionItem[] {
  const { t } = useTranslation('character');
  return useMemo(
    () => [
      { id: 'minus-hp', label: '-HP', icon: 'heart-minus-outline', onPress: () => applyHpDelta(-1) },
      { id: 'plus-hp', label: '+HP', icon: 'heart-plus-outline', onPress: () => applyHpDelta(1) },
      { id: 'edit-hp', label: t('quickActions.editHp'), icon: 'heart-cog-outline', onPress: openHpModal },
      {
        id: 'temp-hp',
        label: t('quickActions.tempHp'),
        icon: 'shield-half-full',
        onPress: () => {
          setTempShieldInput(String(tempHp));
          setIsTempHpModalVisible(true);
        },
      },
      { id: 'roll', label: t('quickActions.roll'), icon: 'dice-multiple-outline', onPress: openDiceRoller },
      { id: 'short-rest', label: t('quickActions.shortRest'), icon: 'coffee-outline', onPress: startShortRestFlow },
      { id: 'long-rest', label: t('quickActions.longRest'), icon: 'weather-night', onPress: applyLongRest },
      {
        id: 'condition',
        label: t('quickActions.condition'),
        icon: 'alert-circle-outline',
        onPress: () => setIsConditionModalVisible(true),
      },
      { id: 'note', label: t('quickActions.note'), icon: 'notebook-outline', onPress: () => setIsQuickNoteModalVisible(true) },
    ],
    [
      applyHpDelta,
      openHpModal,
      startShortRestFlow,
      applyLongRest,
      setTempShieldInput,
      tempHp,
      setIsTempHpModalVisible,
      openDiceRoller,
      setIsConditionModalVisible,
      setIsQuickNoteModalVisible,
      t,
    ],
  );
}
