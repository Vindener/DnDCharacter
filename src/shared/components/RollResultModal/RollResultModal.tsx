import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal } from '@/shared/components/Modal/Modal';
import Loader from '@/shared/components/Loader/Loader';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from './style';

interface RollResult {
  total: number;
  formula: string;
  random: number;
}

interface RollResultModalProps {
  isVisible: boolean;
  onClose: () => void;
  roll: () => RollResult;
}

export const RollResultModal: React.FC<RollResultModalProps> = ({ isVisible, onClose, roll }) => {
  const [result, setResult] = useState<RollResult | null>(null);
  const [previousResult, setPreviousResult] = useState<RollResult | null>(null);

  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    if (isVisible) {
      const first = roll();
      setResult(first);
      setPreviousResult(null);
    }
  }, [isVisible, roll]);

  const handleReroll = () => {
    if (result) {
      setPreviousResult(result); // зберігаємо поточний як минулий
    }
    setResult(roll()); // генеруємо новий
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <Loader />
      {!result && <Loader />}
      {result && (
        <>
          {result.random === 20 && <Text style={styles.criticalSuccess}>Критичний успіх!</Text>}
          {result.random === 1 && <Text style={styles.criticalFailure}>Критична поразка!</Text>}

          <Text style={styles.rollResult}>
            Результат: {result.total} ({result.formula} мод)
          </Text>

          {previousResult && (
            <View style={styles.previousBlock}>
              <Text style={styles.previousTitle}>Минулий кидок:</Text>
              <Text style={styles.previousText}>
                {previousResult.total} ({previousResult.formula} мод)
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.rerollButton} onPress={handleReroll}>
            <Text style={styles.rerollButtonText}>Кинути ще</Text>
          </TouchableOpacity>
        </>
      )}
    </Modal>
  );
};

export default RollResultModal;
