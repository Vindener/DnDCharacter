import React from 'react';
import { Text, Pressable, TextInput as RNTextInput, View, FlatList } from 'react-native';
import { DiceRollerPanel, type DiceRollerPreset } from '@/screens/DiceRoller/DiceRoller';
import { Modal } from '@/shared/components/Modal/Modal';
import { calculateModifier } from '@/shared/helpers/calculateModifier';
import type { DiceRollResult } from '@/shared/services/diceRoller';
import type { CharacterActionsReadyState } from '../hooks/useCharacterActions';

type CharacterModalsProps = Pick<
  CharacterActionsReadyState,
  | 'styles'
  | 'colors'
  | 'characterData'
  | 'isHpModalVisible'
  | 'setIsHpModalVisible'
  | 'saveHpModal'
  | 'tempCurrentHp'
  | 'setTempCurrentHp'
  | 'tempMaxHp'
  | 'setTempMaxHp'
  | 'isTempHpModalVisible'
  | 'setIsTempHpModalVisible'
  | 'saveTempHp'
  | 'tempShieldInput'
  | 'setTempShieldInput'
  | 'isLevelChangeModalVisible'
  | 'levelChangeTarget'
  | 'levelChangeDraftText'
  | 'setLevelDraftField'
  | 'setLevelDraftStat'
  | 'cancelLevelChange'
  | 'confirmLevelChange'
  | 'isDiceModalVisible'
  | 'setIsDiceModalVisible'
  | 'weaponRollRequest'
  | 'closeWeaponRollModal'
  | 'handleContextRollResult'
  | 'isConditionModalVisible'
  | 'setIsConditionModalVisible'
  | 'addCondition'
  | 'conditionInput'
  | 'setConditionInput'
  | 'isQuickNoteModalVisible'
  | 'setIsQuickNoteModalVisible'
  | 'addQuickSessionNote'
  | 'quickNoteInput'
  | 'setQuickNoteInput'
  | 'isSpellQuickModalVisible'
  | 'closeSpellQuickModal'
  | 'quickSpellSearch'
  | 'setQuickSpellSearch'
  | 'quickSpellCandidates'
  | 'pickExistingSpellForQuickAdd'
  | 'quickSpellName'
  | 'setQuickSpellName'
  | 'quickSpellLevel'
  | 'setQuickSpellLevel'
  | 'selectedQuickSpell'
  | 'rollWeaponDamage'
  | 'rollSpellAttack'
  | 'rollSpellDamage'
  | 'spellRollResult'
  | 'preparedSpellsLimit'
  | 'preparedSpellsCount'
  | 'canAddPreparedFromQuickModal'
  | 'isQuickSpellAlreadyPrepared'
  | 'addSpellFromCharacter'
  | 'isRestModalVisible'
  | 'setIsRestModalVisible'
  | 'restStep'
  | 'applyLongRest'
  | 'rollsNeeded'
  | 'rollResults'
  | 'setRollResults'
  | 'diceSides'
  | 'applyShortRestRolls'
>;

const LEVEL_STAT_FIELDS: Array<{ key: keyof CharacterActionsReadyState['characterData']['stats'] & string; label: string }> = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
];

function appendSignedModifier(formula: string, modifier: number): string {
  if (modifier === 0) return formula;
  return `${formula}${modifier > 0 ? `+${modifier}` : modifier}`;
}

function CharacterModalsBase({
  styles,
  colors,
  characterData,
  isHpModalVisible,
  setIsHpModalVisible,
  saveHpModal,
  tempCurrentHp,
  setTempCurrentHp,
  tempMaxHp,
  setTempMaxHp,
  isTempHpModalVisible,
  setIsTempHpModalVisible,
  saveTempHp,
  tempShieldInput,
  setTempShieldInput,
  isLevelChangeModalVisible,
  levelChangeTarget,
  levelChangeDraftText,
  setLevelDraftField,
  setLevelDraftStat,
  cancelLevelChange,
  confirmLevelChange,
  isDiceModalVisible,
  setIsDiceModalVisible,
  weaponRollRequest,
  closeWeaponRollModal,
  handleContextRollResult,
  isConditionModalVisible,
  setIsConditionModalVisible,
  addCondition,
  conditionInput,
  setConditionInput,
  isQuickNoteModalVisible,
  setIsQuickNoteModalVisible,
  addQuickSessionNote,
  quickNoteInput,
  setQuickNoteInput,
  isSpellQuickModalVisible,
  closeSpellQuickModal,
  quickSpellSearch,
  setQuickSpellSearch,
  quickSpellCandidates,
  pickExistingSpellForQuickAdd,
  quickSpellName,
  setQuickSpellName,
  quickSpellLevel,
  setQuickSpellLevel,
  selectedQuickSpell,
  rollWeaponDamage,
  rollSpellAttack,
  rollSpellDamage,
  spellRollResult,
  preparedSpellsLimit,
  preparedSpellsCount,
  canAddPreparedFromQuickModal,
  isQuickSpellAlreadyPrepared,
  addSpellFromCharacter,
  isRestModalVisible,
  setIsRestModalVisible,
  restStep,
  applyLongRest,
  rollsNeeded,
  rollResults,
  setRollResults,
  diceSides,
  applyShortRestRolls,
}: CharacterModalsProps) {
  const [diceModalScrollSignal, setDiceModalScrollSignal] = React.useState(0);
  const [contextRollScrollSignal, setContextRollScrollSignal] = React.useState(0);
  const [restRollScrollSignal, setRestRollScrollSignal] = React.useState(0);

  const scrollDiceModalToTop = React.useCallback(() => {
    setDiceModalScrollSignal((prev) => prev + 1);
  }, []);

  const scrollContextRollModalToTop = React.useCallback(() => {
    setContextRollScrollSignal((prev) => prev + 1);
  }, []);

  const scrollRestRollModalToTop = React.useCallback(() => {
    setRestRollScrollSignal((prev) => prev + 1);
  }, []);

  const quickSpellCandidateKeyExtractor = React.useCallback(
    (spell: CharacterActionsReadyState['quickSpellCandidates'][number]) => `quick-spell-candidate-${spell.id}`,
    [],
  );

  const renderQuickSpellCandidate = React.useCallback(
    ({ item }: { item: CharacterActionsReadyState['quickSpellCandidates'][number] }) => (
      <Pressable
        style={styles.secondaryAction}
        onPress={() => pickExistingSpellForQuickAdd(item)}
        android_ripple={{ color: colors.ripple }}
      >
        <Text style={styles.secondaryActionText}>
          {item.name} • {item.level === 0 ? 'каніпс' : `рівень ${item.level}`}
        </Text>
      </Pressable>
    ),
    [colors.ripple, pickExistingSpellForQuickAdd, styles.secondaryAction, styles.secondaryActionText],
  );

  const contextRollModalTitle = React.useMemo(() => {
    if (!weaponRollRequest) return 'Кидок';
    if (weaponRollRequest.kind === 'ability' || weaponRollRequest.kind === 'saving-throw' || weaponRollRequest.kind === 'skill') {
      return weaponRollRequest.title;
    }
    if (weaponRollRequest.kind === 'weapon-attack') return 'Кидок на влучення';
    if (weaponRollRequest.kind === 'weapon-damage') return 'Кидок шкоди';
    if (weaponRollRequest.kind === 'spell-attack') return 'Атака закляттям';
    return 'Шкода закляттям';
  }, [weaponRollRequest]);

  const contextRollSubtitle = React.useMemo(() => {
    if (!weaponRollRequest) return '';
    if (weaponRollRequest.kind === 'ability' || weaponRollRequest.kind === 'saving-throw' || weaponRollRequest.kind === 'skill') {
      return weaponRollRequest.label;
    }
    if (weaponRollRequest.kind === 'weapon-attack' || weaponRollRequest.kind === 'weapon-damage') {
      return weaponRollRequest.weapon.name || 'Зброя';
    }
    return weaponRollRequest.spellName;
  }, [weaponRollRequest]);

  const contextRollPreset = React.useMemo<DiceRollerPreset | undefined>(() => {
    if (!weaponRollRequest) return undefined;
    if (weaponRollRequest.kind === 'ability' || weaponRollRequest.kind === 'skill') {
      return {
        id: `${weaponRollRequest.kind}-${weaponRollRequest.label}-${weaponRollRequest.baseModifier}`,
        label: weaponRollRequest.title,
        dice: 'd20',
        modifier: weaponRollRequest.baseModifier,
      };
    }
    if (weaponRollRequest.kind === 'saving-throw') {
      return {
        id: `saving-${weaponRollRequest.label}-${weaponRollRequest.baseModifier}-${weaponRollRequest.proficient ? 'prof' : 'raw'}`,
        label: weaponRollRequest.title,
        dice: 'd20',
        modifier: weaponRollRequest.baseModifier,
        proficiencyBonus: characterData.proficiencyBonus ?? 2,
        includeProficiency: weaponRollRequest.proficient,
      };
    }
    if (weaponRollRequest.kind === 'weapon-attack') {
      const attackBonus = Number(weaponRollRequest.weapon.attackBonus || 0);
      const weaponName = weaponRollRequest.weapon.name || 'Зброя';
      return {
        id: `weapon-attack-${weaponName}-${attackBonus}`,
        label: `Влучення: ${weaponName}`,
        dice: 'd20',
        modifier: attackBonus,
      };
    }
    if (weaponRollRequest.kind === 'weapon-damage') {
      const weaponName = weaponRollRequest.weapon.name || 'Зброя';
      const formula = String(weaponRollRequest.weapon.damage || '1d6');
      return {
        id: `weapon-damage-${weaponName}-${formula}`,
        label: `Шкода: ${weaponName}`,
        formula,
      };
    }
    if (weaponRollRequest.kind === 'spell-attack') {
      return {
        id: `spell-attack-${weaponRollRequest.spellName}-${weaponRollRequest.baseModifier}`,
        label: `Атака закляттям: ${weaponRollRequest.spellName}`,
        dice: 'd20',
        modifier: weaponRollRequest.baseModifier,
      };
    }
    return {
      id: `spell-damage-${weaponRollRequest.spellName}-${weaponRollRequest.profile.id}-${weaponRollRequest.profile.formula}`,
      label: `Шкода закляттям: ${weaponRollRequest.spellName}`,
      formula: weaponRollRequest.profile.formula,
    };
  }, [characterData.proficiencyBonus, weaponRollRequest]);

  const contextRollAction = React.useMemo(() => {
    if (!weaponRollRequest || weaponRollRequest.kind !== 'weapon-attack') return null;

    const formula = String(weaponRollRequest.weapon.damage || '1d6');
    return (
      <Pressable
        style={styles.secondaryAction}
        onPress={() => rollWeaponDamage(weaponRollRequest.weapon)}
        android_ripple={{ color: colors.ripple }}
      >
        <Text style={styles.secondaryActionText}>Кинути шкоду ({formula})</Text>
      </Pressable>
    );
  }, [colors.ripple, rollWeaponDamage, styles.secondaryAction, styles.secondaryActionText, weaponRollRequest]);

  const shortRestConModifier = calculateModifier(characterData.stats.constitution || 10);
  const shortRestHealingModifier = shortRestConModifier * rollsNeeded;
  const shortRestFormula = appendSignedModifier(`${rollsNeeded}d${diceSides || 6}`, shortRestHealingModifier);
  const shortRestPreset = React.useMemo<DiceRollerPreset | undefined>(() => {
    if (restStep !== 'roll' || rollsNeeded <= 0 || diceSides <= 0) return undefined;
    return {
      id: `short-rest-${rollsNeeded}-${diceSides}-${shortRestHealingModifier}`,
      label: 'Короткий відпочинок',
      formula: shortRestFormula,
    };
  }, [diceSides, restStep, rollsNeeded, shortRestFormula, shortRestHealingModifier]);

  const handleShortRestRollResult = React.useCallback((result: DiceRollResult) => {
    setRollResults(result.rolls.slice(0, rollsNeeded));
  }, [rollsNeeded, setRollResults]);

  return (
    <>
      <Modal isVisible={isHpModalVisible} onClose={() => setIsHpModalVisible(false)} onSubmit={saveHpModal} title='HP'>
        <Text style={styles.modalLabel}>Поточне HP</Text>
        <RNTextInput
          value={tempCurrentHp}
          onChangeText={setTempCurrentHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='Поточне'
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.modalLabel}>Макс. HP</Text>
        <RNTextInput
          value={tempMaxHp}
          onChangeText={setTempMaxHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='Макс.'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal isVisible={isTempHpModalVisible} onClose={() => setIsTempHpModalVisible(false)} onSubmit={saveTempHp} title='Тимчасове HP'>
        <Text style={styles.modalLabel}>Значення тимчасового HP</Text>
        <RNTextInput
          value={tempShieldInput}
          onChangeText={setTempShieldInput}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='0'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal
        isVisible={isLevelChangeModalVisible}
        onClose={cancelLevelChange}
        title={`Підтвердити рівень ${levelChangeTarget}`}
        subtitle='Редагування основних характеристик перед застосуванням'
      >
        <Text style={styles.modalLabel}>Новий рівень: {levelChangeTarget}</Text>

        <Text style={styles.modalLabel}>Характеристики</Text>
        <View style={styles.levelModalStatsGrid}>
          {LEVEL_STAT_FIELDS.map((field) => (
            <View key={`level-modal-${field.key}`} style={styles.levelModalStatCell}>
              <Text style={styles.blockTextMuted}>{field.label}</Text>
              <RNTextInput
                value={levelChangeDraftText.stats[field.key]}
                onChangeText={(value) => setLevelDraftStat(field.key as keyof CharacterActionsReadyState['characterData']['stats'], value)}
                keyboardType='number-pad'
                style={styles.modalInput}
                placeholder='10'
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          ))}
        </View>

        <Text style={styles.modalLabel}>HP</Text>
        <View style={styles.slotEditRow}>
          <RNTextInput
            value={levelChangeDraftText.hpCurrent}
            onChangeText={(value) => setLevelDraftField('hpCurrent', value)}
            keyboardType='number-pad'
            style={[styles.modalInput, styles.levelModalInlineInput]}
            placeholder='Current'
            placeholderTextColor={colors.textSecondary}
          />
          <RNTextInput
            value={levelChangeDraftText.hpMax}
            onChangeText={(value) => setLevelDraftField('hpMax', value)}
            keyboardType='number-pad'
            style={[styles.modalInput, styles.levelModalInlineInput]}
            placeholder='Max'
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={styles.modalLabel}>AC</Text>
        <RNTextInput
          value={levelChangeDraftText.ac}
          onChangeText={(value) => setLevelDraftField('ac', value)}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='10'
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.modalLabel}>Ініціатива</Text>
        <RNTextInput
          value={levelChangeDraftText.initiative}
          onChangeText={(value) => setLevelDraftField('initiative', value)}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='0'
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.modalLabel}>Бонус майстерності</Text>
        <RNTextInput
          value={levelChangeDraftText.proficiencyBonus}
          onChangeText={(value) => setLevelDraftField('proficiencyBonus', value)}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='2'
          placeholderTextColor={colors.textSecondary}
        />

        <Pressable style={[styles.secondaryAction, styles.levelModalSubmit]} onPress={confirmLevelChange} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>Зберегти</Text>
        </Pressable>
      </Modal>

      <Modal isVisible={isDiceModalVisible} onClose={() => setIsDiceModalVisible(false)} scrollToTopSignal={diceModalScrollSignal}>
        <DiceRollerPanel embedded onRollPress={scrollDiceModalToTop} />
      </Modal>

      <Modal
        isVisible={Boolean(weaponRollRequest)}
        onClose={closeWeaponRollModal}
        title={contextRollModalTitle}
        subtitle={contextRollSubtitle}
        scrollToTopSignal={contextRollScrollSignal}
      >
        {contextRollPreset ? (
          <DiceRollerPanel
            embedded
            autoRoll
            preset={contextRollPreset}
            onRollPress={scrollContextRollModalToTop}
            onRollResult={handleContextRollResult}
            resultAction={contextRollAction}
          />
        ) : null}
      </Modal>

      <Modal isVisible={isConditionModalVisible} onClose={() => setIsConditionModalVisible(false)} onSubmit={addCondition} title='Додати стан'>
        <Text style={styles.modalLabel}>Стан</Text>
        <RNTextInput
          value={conditionInput}
          onChangeText={setConditionInput}
          style={styles.modalInput}
          placeholder='Отруєний'
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>

      <Modal isVisible={isQuickNoteModalVisible} onClose={() => setIsQuickNoteModalVisible(false)} onSubmit={addQuickSessionNote} title='Швидка нотатка'>
        <Text style={styles.modalLabel}>Нотатка сесії</Text>
        <RNTextInput
          value={quickNoteInput}
          onChangeText={setQuickNoteInput}
          style={[styles.modalInput, styles.modalInputMultiline]}
          placeholder='Напишіть коротку нотатку...'
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </Modal>

      <Modal isVisible={isSpellQuickModalVisible} onClose={closeSpellQuickModal} title='Додати закляття'>
        <Text style={styles.modalLabel}>Пошук у Spellbook</Text>
        <RNTextInput
          value={quickSpellSearch}
          onChangeText={setQuickSpellSearch}
          style={styles.modalInput}
          placeholder='Введи назву або школу'
          placeholderTextColor={colors.textSecondary}
        />
                {quickSpellCandidates.length ? (
          <FlatList
            data={quickSpellCandidates}
            renderItem={renderQuickSpellCandidate}
            keyExtractor={quickSpellCandidateKeyExtractor}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={3}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.blockTextMuted}>Нічого не знайдено у spellbook.</Text>
        )}

        <Text style={styles.modalLabel}>Назва закляття</Text>
        <RNTextInput
          value={quickSpellName}
          onChangeText={setQuickSpellName}
          style={styles.modalInput}
          placeholder='Назва закляття'
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.modalLabel}>Рівень (0-9)</Text>
        <RNTextInput
          value={quickSpellLevel}
          onChangeText={setQuickSpellLevel}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder='1'
          placeholderTextColor={colors.textSecondary}
        />
        {!!selectedQuickSpell && (
          <View style={styles.editCardBlock}>
            <Text style={styles.subSectionTitle}>Швидкі кидки: {selectedQuickSpell.name}</Text>
            <View style={styles.weaponActionRow}>
              <Pressable
                style={[styles.weaponActionButton, styles.weaponActionButtonPrimary]}
                onPress={() => rollSpellAttack(selectedQuickSpell.name)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.weaponActionText}>Атака (d20)</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.weaponActionButton,
                  styles.weaponActionButtonSecondary,
                  !selectedQuickSpell.damageProfiles?.[0] ? { opacity: 0.45 } : null,
                ]}
                onPress={() => selectedQuickSpell.damageProfiles?.[0] && rollSpellDamage(selectedQuickSpell.name, selectedQuickSpell.damageProfiles[0])}
                android_ripple={{ color: colors.ripple }}
                disabled={!selectedQuickSpell.damageProfiles?.[0]}
              >
                <Text style={styles.weaponActionText}>
                  {selectedQuickSpell.damageProfiles?.[0]
                    ? `Шкода (${selectedQuickSpell.damageProfiles[0].formula})`
                    : 'Шкода (нема профілю)'}
                </Text>
              </Pressable>
            </View>
            {(selectedQuickSpell.damageProfiles || []).slice(1).map((profile) => (
              <Pressable
                key={`quick-spell-profile-${selectedQuickSpell.id}-${profile.id}`}
                style={styles.secondaryAction}
                onPress={() => rollSpellDamage(selectedQuickSpell.name, profile)}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.secondaryActionText}>
                  Шкода: {profile.label} ({profile.formula} {profile.damageType})
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {!!spellRollResult && (
          <View style={styles.editCardBlock}>
            <Text style={styles.subSectionTitle}>{spellRollResult.title}</Text>
            {spellRollResult.details.map((line, index) => (
              <Text key={`${spellRollResult.title}-quick-${index}`} style={styles.weaponRollResultLine}>
                {line}
              </Text>
            ))}
          </View>
        )}
        {preparedSpellsLimit !== null && <Text style={styles.blockTextMuted}>Підготовлено: {preparedSpellsCount}/{preparedSpellsLimit}</Text>}
        {preparedSpellsLimit !== null && !canAddPreparedFromQuickModal && !isQuickSpellAlreadyPrepared && (
          <Text style={styles.blockTextMuted}>Ліміт підготовлених заклять досягнуто для цього персонажа.</Text>
        )}
        <Pressable style={styles.secondaryAction} onPress={() => addSpellFromCharacter('known')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>+ Додати у відомі</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryAction, !canAddPreparedFromQuickModal ? { opacity: 0.45 } : null]}
          onPress={() => addSpellFromCharacter('prepared')}
          android_ripple={{ color: colors.ripple }}
          disabled={!canAddPreparedFromQuickModal}
        >
          <Text style={styles.secondaryActionText}>+ Додати у підготовлені</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addSpellFromCharacter('cantrip')} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.secondaryActionText}>+ Додати як каніпс</Text>
        </Pressable>
      </Modal>

      <Modal
        isVisible={isRestModalVisible}
        onClose={() => setIsRestModalVisible(false)}
        title='Відпочинок'
        scrollToTopSignal={restRollScrollSignal}
      >
        {restStep === 'choose' && (
          <>
            <Text style={styles.blockTextMuted}>Короткий відпочинок відкриває DiceRoller напряму з панелі швидких дій.</Text>
            <Pressable onPress={applyLongRest} style={styles.restButton} android_ripple={{ color: colors.ripple }}>
              <Text style={styles.restButtonText}>Довгий відпочинок</Text>
            </Pressable>
          </>
        )}
        {restStep === 'roll' && (
          <>
            <Text style={styles.modalLabel}>
              Кості хітів: {rollsNeeded}d{diceSides}
            </Text>
            <Text style={styles.blockTextMuted}>
              CON: {shortRestConModifier >= 0 ? `+${shortRestConModifier}` : shortRestConModifier} за кістку. Формула лікування: {shortRestFormula}
            </Text>
            {shortRestPreset ? (
              <DiceRollerPanel
                embedded
                autoRoll
                preset={shortRestPreset}
                onRollPress={scrollRestRollModalToTop}
                onRollResult={handleShortRestRollResult}
              />
            ) : null}
            {rollResults.length >= rollsNeeded && (
              <Pressable onPress={applyShortRestRolls} style={styles.restButton} android_ripple={{ color: colors.ripple }}>
                <Text style={styles.restButtonText}>Застосувати відпочинок</Text>
              </Pressable>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

export const CharacterModals = React.memo(CharacterModalsBase);



