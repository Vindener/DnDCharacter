import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import type { DiceRollResult, DiceType, RollMode } from '@/shared/services/diceRoller';
import { rollDice, rollFormula } from '@/shared/services/diceRoller';

const DICE_OPTIONS: DiceType[] = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'];
const MODE_OPTIONS: Array<{ id: RollMode; label: string }> = [
  { id: 'normal', label: 'Звичайний' },
  { id: 'advantage', label: 'Перевага' },
  { id: 'disadvantage', label: 'Перешкода' },
];

function signed(value: number): string {
  if (value === 0) return '+0';
  return value > 0 ? `+${value}` : String(value);
}

function appendFormulaModifier(formula: string, modifier: number): string {
  if (modifier === 0) return formula;
  return `${formula}${modifier > 0 ? `+${modifier}` : modifier}`;
}

function formatResultDetails(result: DiceRollResult): string[] {
  const lines: string[] = [];
  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    lines.push(`Кидки: ${result.rolls.join(' / ')}`);
    lines.push(`Використано: ${result.usedRoll}`);
  } else {
    lines.push(`Кидки: ${result.rolls.join(' + ')}`);
  }
  lines.push(`Модифікатор: ${signed(result.modifier)}`);
  if (result.proficiencyBonus) lines.push(`Майстерність: ${signed(result.proficiencyBonus)}`);
  lines.push(`Разом: ${result.total}`);
  return lines;
}

function formatImmediateResult(result: DiceRollResult): string {
  const modifierTotal = result.modifier + result.proficiencyBonus;
  const modifierText = modifierTotal === 0 ? '' : ` ${signed(modifierTotal)}`;

  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    return `Кидки ${result.rolls.join(' / ')} → ${result.usedRoll}${modifierText} = ${result.total}`;
  }

  if (result.rolls.length === 1) {
    return `Кидок ${result.usedRoll}${modifierText} = ${result.total}`;
  }

  return `Куби ${result.rolls.join(' + ')}${modifierText} = ${result.total}`;
}

export type DiceRollerPreset = {
  id: string;
  label?: string;
  dice?: DiceType;
  modifier?: number;
  proficiencyBonus?: number;
  includeProficiency?: boolean;
  mode?: RollMode;
  formula?: string;
};

type DiceRollerPanelProps = {
  embedded?: boolean;
  autoRoll?: boolean;
  onRollPress?: () => void;
  onRollResult?: (result: DiceRollResult) => void;
  preset?: DiceRollerPreset;
  resultAction?: React.ReactNode;
};

type RollExecutionConfig = {
  dice: DiceType;
  modifier: number;
  proficiencyBonus: number;
  includeProficiency: boolean;
  mode: RollMode;
  customFormula: string;
  label?: string;
};

export const DiceRollerPanel: React.FC<DiceRollerPanelProps> = ({
  embedded = false,
  autoRoll = false,
  onRollPress,
  onRollResult,
  preset,
  resultAction,
}) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(1)).current;
  const autoRolledPresetId = useRef<string | null>(null);

  const [selectedDice, setSelectedDice] = useState<DiceType>(preset?.dice ?? 'd20');
  const [modifier, setModifier] = useState(preset?.modifier ?? 0);
  const [proficiencyBonus, setProficiencyBonus] = useState(preset?.proficiencyBonus ?? 2);
  const [includeProficiency, setIncludeProficiency] = useState(preset?.includeProficiency ?? false);
  const [mode, setMode] = useState<RollMode>(preset?.mode ?? 'normal');
  const [customFormula, setCustomFormula] = useState(preset?.formula ?? '');
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [error, setError] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  const resultToneStyle = result?.isCriticalSuccess
    ? styles.resultSuccess
    : result?.isCriticalFailure
      ? styles.resultFailure
      : styles.resultNeutral;

  const animateRoll = useCallback((onComplete: () => void) => {
    setIsRolling(true);
    pulse.setValue(0.88);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 110, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.94, duration: 90, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setIsRolling(false);
      onComplete();
    });
  }, [pulse]);

  const commitResult = useCallback((next: DiceRollResult) => {
    setResult(next);
    setHistory((prev) => [next, ...prev].slice(0, 20));
    onRollResult?.(next);
  }, [onRollResult]);

  const performRollFromConfig = useCallback((config: RollExecutionConfig) => {
    onRollPress?.();
    setError('');
    animateRoll(() => {
      try {
        const formula = config.customFormula.trim();
        const formulaModifier = config.modifier + (config.includeProficiency ? config.proficiencyBonus : 0);
        const next = formula
          ? rollFormula({ formula: appendFormulaModifier(formula, formulaModifier), label: config.label ?? 'Користувацький кидок' })
          : rollDice({
              dice: config.dice,
              count: 1,
              modifier: config.modifier,
              proficiencyBonus: config.proficiencyBonus,
              includeProficiency: config.includeProficiency,
              mode: config.mode,
              label: config.label ?? `Кидок ${config.dice.toUpperCase()}`,
            });
        commitResult(next);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Не вдалося виконати кидок.');
      }
    });
  }, [animateRoll, commitResult, onRollPress]);

  useEffect(() => {
    if (!preset) {
      autoRolledPresetId.current = null;
      return;
    }

    const nextDice = preset.dice ?? 'd20';
    const nextModifier = preset.modifier ?? 0;
    const nextProficiencyBonus = preset.proficiencyBonus ?? 2;
    const nextIncludeProficiency = preset.includeProficiency ?? false;
    const nextMode = preset.mode ?? 'normal';
    const nextFormula = preset.formula ?? '';

    setSelectedDice(nextDice);
    setModifier(nextModifier);
    setProficiencyBonus(nextProficiencyBonus);
    setIncludeProficiency(nextIncludeProficiency);
    setMode(nextMode);
    setCustomFormula(nextFormula);
    setResult(null);
    setHistory([]);
    setError('');

    if (autoRoll && autoRolledPresetId.current !== preset.id) {
      autoRolledPresetId.current = preset.id;
      performRollFromConfig({
        dice: nextDice,
        modifier: nextModifier,
        proficiencyBonus: nextProficiencyBonus,
        includeProficiency: nextIncludeProficiency,
        mode: nextMode,
        customFormula: nextFormula,
        label: preset.label,
      });
    }
  }, [autoRoll, performRollFromConfig, preset]);

  const handleDiceChange = (dice: DiceType) => {
    setSelectedDice(dice);
    if (dice !== 'd20' && mode !== 'normal') setMode('normal');
  };

  const handleModeChange = (nextMode: RollMode) => {
    setMode(nextMode);
    if (nextMode !== 'normal') {
      setSelectedDice('d20');
      if (customFormula.trim()) setCustomFormula('');
    }
  };

  const handleFormulaChange = (value: string) => {
    setCustomFormula(value);
    if (value.trim() && mode !== 'normal') setMode('normal');
  };

  const performRoll = () => {
    performRollFromConfig({
      dice: selectedDice,
      modifier,
      proficiencyBonus,
      includeProficiency,
      mode,
      customFormula,
      label: preset?.label,
    });
  };

  const adjustModifier = (delta: number) => setModifier((prev) => prev + delta);
  const adjustProficiency = (delta: number) => setProficiencyBonus((prev) => Math.max(prev + delta, 0));

  return (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Кидок кубика</Text>
        <Text style={styles.subtitle}>Кидки для перевірок, атак, спаскидків і формул урону.</Text>
      </View>

      <Animated.View style={[styles.resultCard, { transform: [{ scale: pulse }] }, resultToneStyle]}>
        <MaterialCommunityIcons name='dice-multiple-outline' size={48} color={colors.text} />
        <Text style={styles.resultLabel}>{isRolling ? 'Кидаємо...' : result?.label || 'Готово'}</Text>
        <Text style={styles.resultValue}>{isRolling ? '...' : result ? result.total : '—'}</Text>
        {result ? <Text style={styles.resultBreakdownText}>{formatImmediateResult(result)}</Text> : null}
        {result ? <Text style={styles.formulaText}>{result.formula}</Text> : null}
        {result?.isCriticalSuccess ? <Text style={styles.criticalSuccess}>Критичний успіх</Text> : null}
        {result?.isCriticalFailure ? <Text style={styles.criticalFailure}>Критичний провал</Text> : null}
      </Animated.View>
      {result && resultAction ? <View style={styles.resultActionSlot}>{resultAction}</View> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Тип кубика</Text>
        <View style={styles.chipGrid}>
          {DICE_OPTIONS.map((dice) => (
            <Pressable
              key={dice}
              style={[styles.chip, selectedDice === dice ? styles.chipActive : null]}
              onPress={() => handleDiceChange(dice)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.chipText, selectedDice === dice ? styles.chipTextActive : null]}>{dice}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Модифікатор</Text>
        <View style={styles.stepperRow}>
          <Pressable style={styles.stepperButton} onPress={() => adjustModifier(-1)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{signed(modifier)}</Text>
          <Pressable style={styles.stepperButton} onPress={() => adjustModifier(1)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Бонус майстерності</Text>
          <Pressable
            style={[styles.toggleButton, includeProficiency ? styles.toggleButtonActive : null]}
            onPress={() => setIncludeProficiency((prev) => !prev)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.toggleText, includeProficiency ? styles.toggleTextActive : null]}>
              {includeProficiency ? 'Увімк.' : 'Вимк.'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.stepperRow}>
          <Pressable style={styles.stepperButton} onPress={() => adjustProficiency(-1)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{signed(proficiencyBonus)}</Text>
          <Pressable style={styles.stepperButton} onPress={() => adjustProficiency(1)} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Режим</Text>
        <View style={styles.segmented}>
          {MODE_OPTIONS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.segment, mode === item.id ? styles.segmentActive : null]}
              onPress={() => handleModeChange(item.id)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.segmentText, mode === item.id ? styles.segmentTextActive : null]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Власна формула</Text>
        <TextInput
          value={customFormula}
          onChangeText={handleFormulaChange}
          placeholder='1d20+5, 2d6+3, 1d8'
          placeholderTextColor={colors.textSecondary}
          autoCapitalize='none'
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.rollButton} onPress={performRoll} android_ripple={{ color: colors.ripple }} disabled={isRolling}>
          <Text style={styles.rollButtonText}>{result ? 'Кинути ще раз' : 'Кинути'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => setHistory([])} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryButtonText}>Очистити історію</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Історія</Text>
          <Text style={styles.historyCount}>{history.length}</Text>
        </View>
        {!history.length ? <Text style={styles.emptyHistory}>Історія кидків порожня.</Text> : null}
        {history.map((item, index) => (
          <View key={`${item.createdAt.toISOString()}-${index}`} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyFormula}>
                {item.formula} = {item.total}
              </Text>
              <Text style={styles.historyTime}>{item.createdAt.toLocaleTimeString()}</Text>
            </View>
            {formatResultDetails(item).map((line) => (
              <Text key={`${item.createdAt.toISOString()}-${line}`} style={styles.historyDetail}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const DiceRoller: React.FC = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToResult = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScrollView ref={scrollRef} style={styles.container} keyboardShouldPersistTaps='handled'>
      <DiceRollerPanel onRollPress={scrollToResult} />
    </ScrollView>
  );
};

export default DiceRoller;
