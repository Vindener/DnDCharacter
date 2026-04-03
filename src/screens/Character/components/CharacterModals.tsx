import React from 'react';
import { Text, Pressable, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import DiceRoller from '@/screens/DiceRoller/DiceRoller';
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

      <Modal isVisible={isDiceModalVisible} onClose={() => setIsDiceModalVisible(false)} title='Кидок'>
        <DiceRoller />
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
              android_ripple={{ color: '#999' }}
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
                android_ripple={{ color: '#999' }}
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
                android_ripple={{ color: '#999' }}
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
                android_ripple={{ color: '#999' }}
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
        <Pressable style={styles.secondaryAction} onPress={() => addSpellFromCharacter('known')} android_ripple={{ color: '#999' }}>
          <Text style={styles.secondaryActionText}>+ Додати у відомі</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryAction, !canAddPreparedFromQuickModal ? { opacity: 0.45 } : null]}
          onPress={() => addSpellFromCharacter('prepared')}
          android_ripple={{ color: '#999' }}
          disabled={!canAddPreparedFromQuickModal}
        >
          <Text style={styles.secondaryActionText}>+ Додати у підготовлені</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={() => addSpellFromCharacter('cantrip')} android_ripple={{ color: '#999' }}>
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
