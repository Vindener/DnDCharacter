import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { getStyles } from './styles';
import useThemeStore from '@/context/Theme-store';
import type { DiceRollResult, DiceType, RollMode } from '@/shared/services/diceRoller';
import { rollDice, rollFormula } from '@/shared/services/diceRoller';

const DICE_OPTIONS: DiceType[] = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'];
const MODE_OPTIONS: RollMode[] = ['normal', 'advantage', 'disadvantage'];
const MIN_DICE_COUNT = 1;
const MAX_DICE_COUNT = 100;

function signed(value: number): string {
  if (value === 0) return '+0';
  return value > 0 ? `+${value}` : String(value);
}

function appendFormulaModifier(formula: string, modifier: number): string {
  if (modifier === 0) return formula;
  return `${formula}${modifier > 0 ? `+${modifier}` : modifier}`;
}

function clampDiceCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_DICE_COUNT;
  return Math.min(Math.max(Math.floor(count), MIN_DICE_COUNT), MAX_DICE_COUNT);
}

function formatResultDetails(result: DiceRollResult, t: TFunction<'dice'>): string[] {
  const lines: string[] = [];
  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    lines.push(`${t('labels.rolls')}: ${result.rolls.join(' / ')}`);
    lines.push(`${t('labels.used')}: ${result.usedRoll}`);
  } else {
    lines.push(`${t('labels.rolls')}: ${result.rolls.join(' + ')}`);
  }
  lines.push(`${t('labels.modifier')}: ${signed(result.modifier)}`);
  if (result.proficiencyBonus) lines.push(`${t('labels.proficiency')}: ${signed(result.proficiencyBonus)}`);
  lines.push(`${t('labels.total')}: ${result.total}`);
  return lines;
}

function formatImmediateResult(result: DiceRollResult, t: TFunction<'dice'>): string {
  const modifierTotal = result.modifier + result.proficiencyBonus;
  const modifierText = modifierTotal === 0 ? '' : ` ${signed(modifierTotal)}`;

  if (result.mode === 'advantage' || result.mode === 'disadvantage') {
    return t('labels.advantageBreakdown', {
      rolls: result.rolls.join(' / '),
      used: result.usedRoll,
      modifier: modifierText,
      total: result.total,
    });
  }

  if (result.rolls.length === 1) {
    return t('labels.singleRollBreakdown', { roll: result.usedRoll, modifier: modifierText, total: result.total });
  }

  return t('labels.multiRollBreakdown', { rolls: result.rolls.join(' + '), modifier: modifierText, total: result.total });
}

export type DiceRollerPreset = {
  id: string;
  label?: string;
  dice?: DiceType;
  modifier?: number;
  proficiencyBonus?: number;
  includeProficiency?: boolean;
  mode?: RollMode;
  count?: number;
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
  count: number;
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
  const { t } = useTranslation('dice');
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(1)).current;
  const autoRolledPresetId = useRef<string | null>(null);

  const [selectedDice, setSelectedDice] = useState<DiceType>(preset?.dice ?? 'd20');
  const [modifier, setModifier] = useState(preset?.modifier ?? 0);
  const [proficiencyBonus, setProficiencyBonus] = useState(preset?.proficiencyBonus ?? 2);
  const [includeProficiency, setIncludeProficiency] = useState(preset?.includeProficiency ?? false);
  const [mode, setMode] = useState<RollMode>(preset?.mode ?? 'normal');
  const [diceCount, setDiceCount] = useState(clampDiceCount(preset?.count ?? 1));
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
  const isCountLocked = mode !== 'normal';

  const animateRoll = useCallback(
    (onComplete: () => void) => {
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
    },
    [pulse],
  );

  const commitResult = useCallback(
    (next: DiceRollResult) => {
      setResult(next);
      setHistory((prev) => [next, ...prev].slice(0, 20));
      onRollResult?.(next);
    },
    [onRollResult],
  );

  const performRollFromConfig = useCallback(
    (config: RollExecutionConfig) => {
      onRollPress?.();
      setError('');
      animateRoll(() => {
        try {
          const formula = config.customFormula.trim();
          const formulaModifier = config.modifier + (config.includeProficiency ? config.proficiencyBonus : 0);
          const next = formula
            ? rollFormula({ formula: appendFormulaModifier(formula, formulaModifier), label: config.label ?? t('labels.customRoll') })
            : rollDice({
                dice: config.dice,
                count: config.mode === 'normal' ? config.count : 1,
                modifier: config.modifier,
                proficiencyBonus: config.proficiencyBonus,
                includeProficiency: config.includeProficiency,
                mode: config.mode,
                label:
                  config.label ??
                  t('labels.diceRoll', {
                    dice: `${config.mode === 'normal' ? config.count : 1}${config.dice}`.toUpperCase(),
                  }),
              });
          commitResult(next);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : t('errors.rollFailed'));
        }
      });
    },
    [animateRoll, commitResult, onRollPress, t],
  );

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
    const nextCount = nextMode === 'normal' ? clampDiceCount(preset.count ?? 1) : 1;
    const nextFormula = preset.formula ?? '';

    setSelectedDice(nextDice);
    setModifier(nextModifier);
    setProficiencyBonus(nextProficiencyBonus);
    setIncludeProficiency(nextIncludeProficiency);
    setMode(nextMode);
    setDiceCount(nextCount);
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
        count: nextCount,
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
      setDiceCount(1);
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
      count: diceCount,
      customFormula,
      label: preset?.label,
    });
  };

  const adjustModifier = (delta: number) => setModifier((prev) => prev + delta);
  const adjustProficiency = (delta: number) => setProficiencyBonus((prev) => Math.max(prev + delta, 0));
  const adjustDiceCount = (delta: number) => setDiceCount((prev) => clampDiceCount(prev + delta));

  return (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>
      </View>

      <Animated.View style={[styles.resultCard, { transform: [{ scale: pulse }] }, resultToneStyle]}>
        <MaterialCommunityIcons name='dice-multiple-outline' size={48} color={colors.text} />
        <Text style={styles.resultLabel}>{isRolling ? t('labels.rolling') : result?.label || t('labels.ready')}</Text>
        <Text style={styles.resultValue}>{isRolling ? '...' : result ? result.total : '—'}</Text>
        {result ? <Text style={styles.resultBreakdownText}>{formatImmediateResult(result, t)}</Text> : null}
        {result ? <Text style={styles.formulaText}>{result.formula}</Text> : null}
        {result?.isCriticalSuccess ? <Text style={styles.criticalSuccess}>{t('labels.criticalSuccess')}</Text> : null}
        {result?.isCriticalFailure ? <Text style={styles.criticalFailure}>{t('labels.criticalFailure')}</Text> : null}
      </Animated.View>
      {result && resultAction ? <View style={styles.resultActionSlot}>{resultAction}</View> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('labels.diceType')}</Text>
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
        <Text style={styles.sectionTitle}>{t('labels.count')}</Text>
        <View style={styles.stepperRow}>
          <Pressable
            testID='diceRoller.count.decrement'
            style={[styles.stepperButton, isCountLocked ? styles.stepperButtonDisabled : null]}
            onPress={() => adjustDiceCount(-1)}
            android_ripple={{ color: colors.ripple }}
            disabled={isCountLocked || diceCount <= MIN_DICE_COUNT}
          >
            <Text style={styles.stepperText}>-</Text>
          </Pressable>
          <Text testID='diceRoller.count.value' style={styles.stepperValue}>
            {diceCount}
          </Text>
          <Pressable
            testID='diceRoller.count.increment'
            style={[styles.stepperButton, isCountLocked ? styles.stepperButtonDisabled : null]}
            onPress={() => adjustDiceCount(1)}
            android_ripple={{ color: colors.ripple }}
            disabled={isCountLocked || diceCount >= MAX_DICE_COUNT}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>
        {isCountLocked ? <Text style={styles.helperText}>{t('labels.countLockedForD20Mode')}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('labels.modifier')}</Text>
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
          <Text style={styles.sectionTitle}>{t('labels.proficiencyBonus')}</Text>
          <Pressable
            style={[styles.toggleButton, includeProficiency ? styles.toggleButtonActive : null]}
            onPress={() => setIncludeProficiency((prev) => !prev)}
            android_ripple={{ color: colors.ripple }}
          >
            <Text style={[styles.toggleText, includeProficiency ? styles.toggleTextActive : null]}>
              {includeProficiency ? t('toggles.enabled') : t('toggles.disabled')}
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
        <Text style={styles.sectionTitle}>{t('labels.mode')}</Text>
        <View style={styles.segmented}>
          {MODE_OPTIONS.map((item, index) => (
            <Pressable
              key={item}
              testID={`diceRoller.mode.${item}`}
              style={[styles.segment, index > 0 ? styles.segmentDivider : null, mode === item ? styles.segmentActive : null]}
              onPress={() => handleModeChange(item)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.segmentText, mode === item ? styles.segmentTextActive : null]}>{t(`modes.${item}`)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('labels.customFormula')}</Text>
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
        <Pressable
          testID='diceRoller.rollButton'
          style={styles.rollButton}
          onPress={performRoll}
          android_ripple={{ color: colors.ripple }}
          disabled={isRolling}
        >
          <Text style={styles.rollButtonText}>{result ? t('actions.rollAgain') : t('actions.roll')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => setHistory([])} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryButtonText}>{t('actions.clearHistory')}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('labels.history')}</Text>
          <Text style={styles.historyCount}>{history.length}</Text>
        </View>
        {!history.length ? <Text style={styles.emptyHistory}>{t('empty.history')}</Text> : null}
        {history.map((item, index) => (
          <View key={`${item.createdAt.toISOString()}-${index}`} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyFormula}>
                {item.formula} = {item.total}
              </Text>
              <Text style={styles.historyTime}>{item.createdAt.toLocaleTimeString()}</Text>
            </View>
            {formatResultDetails(item, t).map((line) => (
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
