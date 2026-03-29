// @ts-nocheck

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import useCharacterStore from '@/context/Character-store';
import { Weapon as WeaponType } from '@/types/Weapon';

// ---------- Helpers ----------
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const parseDice = (expr: string): { count: number; sides: number } => {
  if (!expr) return { count: 1, sides: 6 };
  const m = String(expr).trim().toLowerCase().match(/(\d+)d(\d+)/);
  if (!m) return { count: 1, sides: 6 };
  return { count: parseInt(m[1], 10) || 1, sides: parseInt(m[2], 10) || 6 };
};

const rollDice = (expr: string) => {
  const { count, sides } = parseDice(expr);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(randInt(1, sides));
  const total = rolls.reduce((a, b) => a + b, 0);
  return { rolls, total };
};

// ---------- Empty weapon template ----------
const EMPTY_WEAPON: WeaponType = {
  name: '',
  damage: '1d6',
  damageType: '',
  properties: [],
};

// ---------- Component ----------
const Weapons: React.FC = () => {
  // ✅ Стабільні селектори без кортежів і без .find у селекторі
  const currentCharacterId = useCharacterStore((s) => s.currentCharacterId);
  const characters = useCharacterStore((s) => s.characters);
  const updateCharacterWeapons = useCharacterStore((s) => s.updateCharacterWeapons);

  const currentChar = useMemo(
    () => characters.find((c) => c.id === currentCharacterId),
    [characters, currentCharacterId]
  );
  const safeWeapons: WeaponType[] = useMemo(() => currentChar?.weapons ?? [], [currentChar?.weapons]);

  // Local modal state
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

  const handleRemoveWeapon = (idx: number) => {
    const next = safeWeapons.filter((_, i) => i !== idx);
    updateWeapons(next);
  };

  const patchWeapon = (idx: number, patch: Partial<WeaponType>) => {
    const next = safeWeapons.slice();
    next[idx] = { ...next[idx], ...patch };
    updateWeapons(next);
  };

  const openAttackModal = (idx: number) => {
    setRollResult('');
    setModalOpen({ kind: 'attack', index: idx });
  };

  const openDamageModal = (idx: number) => {
    setRollResult('');
    setModalOpen({ kind: 'damage', index: idx });
  };

  const closeModal = () => setModalOpen(null);

  const doAttackRoll = () => {
    const d = randInt(1, 20);
    const bonus = Number(attackBonus || '0');
    const ac = Number(targetAC || '0');
    const total = d + bonus;
    let text = `🎯 Кидок d20: ${d}  |  Бонус: ${bonus}  →  Разом: ${total}\n`;
    if (d === 20) text += 'Критичне влучання!\n';
    if (d === 1) text += 'Автопромах!\n';
    text += total >= ac ? `✅ Влучив проти AC ${ac}` : `❌ Промах проти AC ${ac}`;
    setRollResult(text);
  };

  const doDamageRoll = (idx: number) => {
    const w = safeWeapons[idx];
    const expr = w?.damage || '1d6';
    const { rolls, total } = rollDice(expr);
    const mod = Number(damageMod || '0');
    const sum = total + mod;
    const text = `💥 Кидок ${expr}: [${rolls.join(', ')}]  (${total})  + мод ${mod}  →  Разом: ${sum}`;
    setRollResult(text);
  };

  return (
    <View>
      <ScrollView keyboardShouldPersistTaps="handled">
        {safeWeapons.map((w, i) => (
          <View key={`${w.name}-${i}`} style={{ marginBottom: 16, borderRadius: 12, padding: 12, backgroundColor: '#2c2c2e' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Зброя #{i + 1}</Text>
              <TouchableOpacity onPress={() => handleRemoveWeapon(i)}>
                <Text style={{ color: '#ff6666' }}>🗑 Видалити</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#bbb', marginTop: 8 }}>Назва</Text>
            <TextInput
              style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
              value={w.name}
              onChangeText={(t) => patchWeapon(i, { name: t })}
              placeholder="Напр.: Короткий меч"
              placeholderTextColor="#888"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#bbb', marginTop: 8 }}>Урон (XdY)</Text>
                <TextInput
                  style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
                  value={w.damage}
                  onChangeText={(t) => patchWeapon(i, { damage: t })}
                  placeholder="1d8"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#bbb', marginTop: 8 }}>Тип шкоди</Text>
                <TextInput
                  style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
                  value={w.damageType || ''}
                  onChangeText={(t) => patchWeapon(i, { damageType: t })}
                  placeholder="колюча / ріжуча / дробляча"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <Text style={{ color: '#bbb', marginTop: 8 }}>Властивості (через кому)</Text>
            <TextInput
              style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
              value={(w.properties || []).join(', ')}
              onChangeText={(t) => {
                const arr = t.split(',').map((s) => s.trim()).filter(Boolean);
                patchWeapon(i, { properties: arr });
              }}
              placeholder="фехтувальна, легка, двуручна"
              placeholderTextColor="#888"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setModalOpen({ kind: 'attack', index: i })} style={{ flex: 1, backgroundColor: '#3a7afe', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Кидок на влучання</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalOpen({ kind: 'damage', index: i })} style={{ flex: 1, backgroundColor: '#7a3afe', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Кидок на урон</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={handleAddWeapon} style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#2c2c2e', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>+ Додати зброю</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for rolls */}
      <Modal visible={!!modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 480, borderRadius: 16, backgroundColor: '#2c2c2e', padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                {modalOpen?.kind === 'attack' ? 'Кидок на влучання' : 'Кидок на урон'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(null)}><Text style={{ color: '#bbb' }}>✕</Text></TouchableOpacity>
            </View>

            {modalOpen?.kind === 'attack' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#bbb' }}>КД цілі</Text>
                <TextInput
                  style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
                  value={targetAC}
                  onChangeText={setTargetAC}
                  keyboardType="numeric"
                  placeholder="Напр.: 13"
                  placeholderTextColor="#888"
                />
                <Text style={{ color: '#bbb', marginTop: 8 }}>Бонус атаки</Text>
                <TextInput
                  style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
                  value={attackBonus}
                  onChangeText={setAttackBonus}
                  keyboardType="numeric"
                  placeholder="+5"
                  placeholderTextColor="#888"
                />

                <TouchableOpacity onPress={() => {
                  const d = randInt(1, 20);
                  const bonus = Number(attackBonus || '0');
                  const ac = Number(targetAC || '0');
                  const total = d + bonus;
                  let text = `🎯 Кидок d20: ${d}  |  Бонус: ${bonus}  →  Разом: ${total}\n`;
                  if (d === 20) text += 'Критичне влучання!\n';
                  if (d === 1) text += 'Автопромах!\n';
                  text += total >= ac ? `✅ Влучив проти AC ${ac}` : `❌ Промах проти AC ${ac}`;
                  setRollResult(text);
                }} style={{ marginTop: 12, backgroundColor: '#3a7afe', padding: 12, borderRadius: 10, alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>Кинути d20</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#bbb' }}>Модифікатор урону</Text>
                <TextInput
                  style={{ backgroundColor: '#1c1c1e', color: 'white', borderRadius: 8, padding: 8, marginTop: 4 }}
                  value={damageMod}
                  onChangeText={setDamageMod}
                  keyboardType="numeric"
                  placeholder="+3"
                  placeholderTextColor="#888"
                />

                <TouchableOpacity
                  onPress={() => {
                    if (modalOpen) {
                      const idx = modalOpen.index;
                      const w = safeWeapons[idx];
                      const expr = w?.damage || '1d6';
                      const { rolls, total } = rollDice(expr);
                      const mod = Number(damageMod || '0');
                      const sum = total + mod;
                      const text = `💥 Кидок ${expr}: [${rolls.join(', ')}]  (${total})  + мод ${mod}  →  Разом: ${sum}`;
                      setRollResult(text);
                    }
                  }}
                  style={{ marginTop: 12, backgroundColor: '#7a3afe', padding: 12, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Кинути куби</Text>
                </TouchableOpacity>
              </View>
            )}

            {!!rollResult && (
              <View style={{ marginTop: 12, backgroundColor: '#1c1c1e', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: 'white' }}>{rollResult}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Weapons;
