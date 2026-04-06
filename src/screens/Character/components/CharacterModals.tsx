import React from 'react';
import { Text, Pressable, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import Dice from '@/screens/Dice/Dice';
import { Modal } from '@/shared/components/Modal/Modal';
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
  | 'setRestStep'
  | 'shortRestDice'
  | 'setShortRestDice'
  | 'startShortRestRoll'
  | 'applyLongRest'
  | 'rollsNeeded'
  | 'rollResults'
  | 'setRollResults'
  | 'diceSides'
  | 'applyShortRestRolls'
>;

const QUICK_DICE_OPTIONS = [4, 6, 8, 10, 12, 20] as const;
const LEVEL_STAT_FIELDS: Array<{ key: keyof CharacterActionsReadyState['characterData']['stats']; label: string }> = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
];

export function CharacterModals({
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
  setRestStep,
  shortRestDice,
  setShortRestDice,
  startShortRestRoll,
  applyLongRest,
  rollsNeeded,
  rollResults,
  setRollResults,
  diceSides,
  applyShortRestRolls,
}: CharacterModalsProps) {
  const [quickDiceSides, setQuickDiceSides] = React.useState<number>(20);
  const [quickDiceResult, setQuickDiceResult] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isDiceModalVisible) {
      setQuickDiceResult(null);
      setQuickDiceSides(20);
    }
  }, [isDiceModalVisible]);

  const rollQuickDice = React.useCallback(() => {
    const value = Math.floor(Math.random() * quickDiceSides) + 1;
    setQuickDiceResult(value);
  }, [quickDiceSides]);

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
                onChangeText={(value) => setLevelDraftStat(field.key, value)}
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

      <Modal isVisible={isDiceModalVisible} onClose={() => setIsDiceModalVisible(false)} title='Кидок'>
        <Text style={styles.modalLabel}>Оберіть кубик</Text>
        <View style={styles.diceQuickGrid}>
          {QUICK_DICE_OPTIONS.map((sides) => (
            <Pressable
              key={`quick-dice-${sides}`}
              style={[styles.diceQuickChip, quickDiceSides === sides ? styles.diceQuickChipActive : null]}
              onPress={() => setQuickDiceSides(sides)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={[styles.diceQuickChipText, quickDiceSides === sides ? styles.diceQuickChipTextActive : null]}>К{sides}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.restButton} onPress={rollQuickDice} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.restButtonText}>Кинути К{quickDiceSides}</Text>
        </Pressable>

        {quickDiceResult !== null && (
          <View style={styles.diceQuickResultCard}>
            <Text style={styles.blockTextMuted}>Результат кидка</Text>
            <Text style={styles.diceQuickResultValue}>{quickDiceResult}</Text>
          </View>
        )}
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
          quickSpellCandidates.map((spell) => (
            <Pressable
              key={`quick-spell-candidate-${spell.id}`}
              style={styles.secondaryAction}
              onPress={() => pickExistingSpellForQuickAdd(spell)}
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.secondaryActionText}>
                {spell.name} • {spell.level === 0 ? 'каніпс' : `рівень ${spell.level}`}
              </Text>
            </Pressable>
          ))
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

      <Modal isVisible={isRestModalVisible} onClose={() => setIsRestModalVisible(false)} title='Відпочинок'>
        {restStep === 'choose' && (
          <>
            <TouchableOpacity onPress={() => setRestStep('short')} style={styles.restButton}>
              <Text style={styles.restButtonText}>Короткий відпочинок</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyLongRest} style={styles.restButton}>
              <Text style={styles.restButtonText}>Довгий відпочинок</Text>
            </TouchableOpacity>
          </>
        )}
        {restStep === 'short' && (
          <>
            <Text style={styles.modalLabel}>Доступні кості хітів: {characterData.hitDice}</Text>
            <RNTextInput
              value={shortRestDice}
              onChangeText={setShortRestDice}
              keyboardType='number-pad'
              style={styles.modalInput}
              placeholder='1'
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={startShortRestRoll} style={styles.restButton}>
              <Text style={styles.restButtonText}>Кинути кості хітів</Text>
            </TouchableOpacity>
          </>
        )}
        {restStep === 'roll' && (
          <>
            <Text style={styles.modalLabel}>
              Roll {rollResults.length + 1} of {rollsNeeded}
            </Text>
            <Dice sides={diceSides} onRoll={(value: number) => setRollResults((prev) => (prev.length < rollsNeeded ? [...prev, value] : prev))} />
            {rollResults.length >= rollsNeeded && (
              <TouchableOpacity onPress={applyShortRestRolls} style={styles.restButton}>
                <Text style={styles.restButtonText}>Застосувати відпочинок</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

