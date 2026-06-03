import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import useCharacterStore from '@/context/Character-store';
import useThemeStore from '@/context/Theme-store';
import { Weapon as WeaponType } from '@/types/Weapon';
import { fs, rd, sp } from '@/shared/styles/tokens';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const parseDice = (expr: string): { count: number; sides: number } => {
  if (!expr) return { count: 1, sides: 6 };
  const match = String(expr).trim().toLowerCase().match(/(\d+)d(\d+)/);
  if (!match) return { count: 1, sides: 6 };
  return { count: parseInt(match[1], 10) || 1, sides: parseInt(match[2], 10) || 6 };
};

const rollDice = (expr: string) => {
  const { count, sides } = parseDice(expr);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(randInt(1, sides));
  const total = rolls.reduce((sum, value) => sum + value, 0);
  return { rolls, total };
};

const EMPTY_WEAPON: WeaponType = {
  name: '',
  attackBonus: 0,
  damage: '1d6',
};

const Weapons: React.FC = () => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: sp(10),
        },
        weaponCard: {
          marginBottom: sp(16),
          borderRadius: rd(12),
          padding: sp(12),
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        weaponHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        weaponTitle: {
          color: colors.text,
          fontWeight: '600',
          fontSize: fs(16),
        },
        removeText: {
          color: colors.danger,
        },
        fieldLabel: {
          color: colors.textSecondary,
          marginTop: sp(8),
        },
        input: {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          borderRadius: rd(8),
          borderWidth: 1,
          borderColor: colors.border,
          padding: sp(8),
          marginTop: sp(4),
        },
        actionRow: {
          flexDirection: 'row',
          gap: sp(12),
          marginTop: sp(12),
        },
        primaryButton: {
          flex: 1,
          backgroundColor: colors.primary,
          padding: sp(10),
          borderRadius: rd(10),
          alignItems: 'center',
        },
        magicButton: {
          flex: 1,
          backgroundColor: colors.magic,
          padding: sp(10),
          borderRadius: rd(10),
          alignItems: 'center',
        },
        buttonText: {
          color: colors.onPrimary,
          fontWeight: '600',
        },
        addWeaponButton: {
          marginTop: sp(8),
          alignSelf: 'flex-start',
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: sp(10),
          paddingHorizontal: sp(14),
          borderRadius: rd(10),
        },
        addWeaponText: {
          color: colors.text,
          fontWeight: '600',
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.overlayStrong,
          justifyContent: 'center',
          alignItems: 'center',
          padding: sp(16),
        },
        modalCard: {
          width: '100%',
          maxWidth: 480,
          borderRadius: rd(16),
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: sp(16),
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        modalTitle: {
          color: colors.text,
          fontSize: fs(18),
          fontWeight: '700',
        },
        modalCloseText: {
          color: colors.textSecondary,
        },
        rollResultBox: {
          marginTop: sp(12),
          backgroundColor: colors.inputBackground,
          borderRadius: rd(10),
          padding: sp(12),
        },
        rollResultText: {
          color: colors.text,
        },
      }),
    [colors],
  );

  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const characters = useCharacterStore((s) => s.characters);
  const updateCharacterWeapons = useCharacterStore((s) => s.updateCharacterWeapons);

  const currentChar = useMemo(() => characters.find((character) => character.id === currentCharacterId), [characters, currentCharacterId]);
  const safeWeapons: WeaponType[] = useMemo(() => currentChar?.weapons ?? [], [currentChar?.weapons]);

  const [modalOpen, setModalOpen] = useState<null | { kind: 'attack' | 'damage'; index: number }>(null);
  const [targetAC, setTargetAC] = useState<string>('12');
  const [attackBonus, setAttackBonus] = useState<string>('0');
  const [damageMod, setDamageMod] = useState<string>('0');
  const [rollResult, setRollResult] = useState<string>('');

  const updateWeapons = (next: WeaponType[]) => {
    if (!currentCharacterId) return;
    updateCharacterWeapons(currentCharacterId, next);
  };

  const handleAddWeapon = () => {
    updateWeapons([...(safeWeapons || []), { ...EMPTY_WEAPON }]);
  };

  const handleRemoveWeapon = (index: number) => {
    const next = safeWeapons.filter((_, i) => i !== index);
    updateWeapons(next);
  };

  const patchWeapon = (index: number, patch: Partial<WeaponType>) => {
    const next = safeWeapons.slice();
    next[index] = { ...next[index], ...patch };
    updateWeapons(next);
  };

  const openAttackModal = (index: number) => {
    setRollResult('');
    setModalOpen({ kind: 'attack', index });
  };

  const openDamageModal = (index: number) => {
    setRollResult('');
    setModalOpen({ kind: 'damage', index });
  };

  const closeModal = () => setModalOpen(null);

  const doAttackRoll = () => {
    const d20 = randInt(1, 20);
    const bonus = Number(attackBonus || '0');
    const ac = Number(targetAC || '0');
    const total = d20 + bonus;
    let text = `Кидок d20: ${d20}  |  Бонус: ${bonus}  ->  Разом: ${total}\n`;
    if (d20 === 20) text += 'Критичне влучання!\n';
    if (d20 === 1) text += 'Автопромах!\n';
    text += total >= ac ? `Влучив проти AC ${ac}` : `Промах проти AC ${ac}`;
    setRollResult(text);
  };

  const doDamageRoll = (index: number) => {
    const weapon = safeWeapons[index];
    const expression = weapon?.damage || '1d6';
    const { rolls, total } = rollDice(expression);
    const modifier = Number(damageMod || '0');
    const sum = total + modifier;
    const text = `Кидок ${expression}: [${rolls.join(', ')}] (${total}) + мод ${modifier} -> Разом: ${sum}`;
    setRollResult(text);
  };

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        {safeWeapons.map((weapon, index) => (
          <View key={`${weapon.name}-${index}`} style={styles.weaponCard}>
            <View style={styles.weaponHeader}>
              <Text style={styles.weaponTitle}>Зброя #{index + 1}</Text>
              <TouchableOpacity onPress={() => handleRemoveWeapon(index)}>
                <Text style={styles.removeText}>Видалити</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Назва</Text>
            <TextInput
              style={styles.input}
              value={weapon.name}
              onChangeText={(value) => patchWeapon(index, { name: value })}
              placeholder='Напр.: Короткий меч'
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Шкода (XdY)</Text>
            <TextInput
              style={styles.input}
              value={weapon.damage}
              onChangeText={(value) => patchWeapon(index, { damage: value })}
              placeholder='1d8'
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => openAttackModal(index)} style={styles.primaryButton}>
                <Text style={styles.buttonText}>Кидок на влучання</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openDamageModal(index)} style={styles.magicButton}>
                <Text style={styles.buttonText}>Кидок на урон</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={handleAddWeapon} style={styles.addWeaponButton}>
          <Text style={styles.addWeaponText}>+ Додати зброю</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!modalOpen} transparent animationType='fade' onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalOpen?.kind === 'attack' ? 'Кидок на влучання' : 'Кидок на урон'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCloseText}>Закрити</Text>
              </TouchableOpacity>
            </View>

            {modalOpen?.kind === 'attack' ? (
              <View style={{ marginTop: sp(12) }}>
                <Text style={styles.fieldLabel}>КД цілі</Text>
                <TextInput
                  style={styles.input}
                  value={targetAC}
                  onChangeText={setTargetAC}
                  keyboardType='numeric'
                  placeholder='Напр.: 13'
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.fieldLabel}>Бонус атаки</Text>
                <TextInput
                  style={styles.input}
                  value={attackBonus}
                  onChangeText={setAttackBonus}
                  keyboardType='numeric'
                  placeholder='+5'
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity onPress={doAttackRoll} style={[styles.primaryButton, { marginTop: sp(12) }]}>
                  <Text style={styles.buttonText}>Кинути d20</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: sp(12) }}>
                <Text style={styles.fieldLabel}>Модифікатор урону</Text>
                <TextInput
                  style={styles.input}
                  value={damageMod}
                  onChangeText={setDamageMod}
                  keyboardType='numeric'
                  placeholder='+3'
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                  onPress={() => {
                    if (modalOpen) doDamageRoll(modalOpen.index);
                  }}
                  style={[styles.magicButton, { marginTop: sp(12) }]}
                >
                  <Text style={styles.buttonText}>Кинути куби</Text>
                </TouchableOpacity>
              </View>
            )}

            {!!rollResult && (
              <View style={styles.rollResultBox}>
                <Text style={styles.rollResultText}>{rollResult}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Weapons;


