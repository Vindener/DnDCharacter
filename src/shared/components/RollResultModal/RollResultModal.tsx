import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
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
  const [hasRerolled, setHasRerolled] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    if (isVisible) {
      setResult(roll());
      setHasRerolled(false);
    }
  }, [isVisible, roll]);

  const handleReroll = () => {
    if (hasRerolled) return;
    setResult(roll());
    setHasRerolled(true);
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
          {!hasRerolled && (
            <TouchableOpacity style={styles.rerollButton} onPress={handleReroll}>
              <Text style={styles.rerollButtonText}>кинути ще раз</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </Modal>
  );
};

export default RollResultModal;
