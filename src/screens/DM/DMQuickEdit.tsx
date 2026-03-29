import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { appendQuickSessionNote } from '@/shared/helpers/homebrew';
import type { CharacterDto } from '@/types/Character';
import { upsertCharacterSheetFromLocal } from '@/services/characterSheets';
import { fbAuth } from '@/services/firebase';

type Props = StackScreenProps<DMStackParamList, 'DMQuickEdit'>;

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DMQuickEdit: React.FC<Props> = ({ route }) => {
  const { characterId } = route.params;
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const character = useCharacterStore((s) => s.characters.find((item) => item.id === characterId));
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);

  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);

  const [conditionInput, setConditionInput] = useState('');
  const [inventoryInput, setInventoryInput] = useState('');
  const [shortNoteInput, setShortNoteInput] = useState('');
  const [syncFeedback, setSyncFeedback] = useState('Ready');

  const commitPatch = async (buildNext: (prev: CharacterDto) => CharacterDto, paths: string[]) => {
    const current = useCharacterStore.getState().characters.find((item) => item.id === characterId);
    if (!current) return;

    const next = buildNext(current);
    await updateCharacter(current.id, next);
    await markLocalDraftPaths(current.id, paths);

    const isSignedIn = Boolean(fbAuth.currentUser);
    await ensureCharacterSync(current.id, isSignedIn);

    if (!isSignedIn) {
      setSyncFeedback('Saved locally');
      return;
    }

    try {
      await setSyncTransport(current.id, 'syncing', 'Syncing DM quick edit...');
      await upsertCharacterSheetFromLocal(next, {
        historyPaths: paths,
        actorRole: 'DM',
      });
      await markCloudUploaded(current.id);
      await setSyncTransport(current.id, 'synced', 'Synced');
      setSyncFeedback('Synced');
    } catch (error) {
      const message = String((error as Error)?.message || 'Sync failed');
      await markSyncError(current.id, message);
      setSyncFeedback(message);
    }
  };

  const spellSlotEntries = useMemo(() => {
    if (!character) return [] as Array<[string, { max: number; used: number }]>;
    return Object.entries(character.spells?.spellSlots || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [character]);

  if (!character) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>DM Quick Edit</Text>
            <Text style={styles.hint}>Character not found in local storage.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>DM Quick Edit • {character.name || 'Character'}</Text>
        <Text style={styles.hint}>Expanded quick edit with DM attribution and shared history markers.</Text>
        <Text style={styles.hint}>Feedback: {syncFeedback}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>HP / AC / Initiative</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch(
                (prev) => ({ ...prev, hp: { ...prev.hp, current: Math.max(0, (prev.hp?.current || 0) - 1) } }),
                ['combat.hp'],
              );
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='heart-dislike-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>HP -1</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch(
                (prev) => ({ ...prev, hp: { ...prev.hp, current: Math.min(prev.hp?.max || 0, (prev.hp?.current || 0) + 1) } }),
                ['combat.hp'],
              );
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='heart-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>HP +1</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch(
                (prev) => ({ ...prev, hp: { ...prev.hp, temp: (prev.hp?.temp || 0) + 1 } }),
                ['combat.hp'],
              );
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='shield-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Temp HP +1</Text>
          </Pressable>
        </View>

        <Text style={styles.updateMeta}>Current HP: {character.hp?.current || 0}/{character.hp?.max || 0} • Temp: {character.hp?.temp || 0}</Text>
        <Text style={styles.updateMeta}>AC: {character.ac || 0} • Initiative: {character.initiative || 0}</Text>

        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, ac: (prev.ac || 0) + 1 }), ['combat.core']);
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='add-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>AC +1</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, initiative: (prev.initiative || 0) + 1 }), ['combat.core']);
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='flash-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Initiative +1</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Conditions</Text>
        <TextInput
          value={conditionInput}
          onChangeText={setConditionInput}
          placeholder='Condition name'
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
        />
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              const nextCondition = conditionInput.trim();
              if (!nextCondition) return;
              void commitPatch(
                (prev) => ({
                  ...prev,
                  conditions: Array.from(new Set([...(prev.conditions || []), nextCondition])),
                }),
                ['combat.conditions'],
              );
              setConditionInput('');
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='add-circle-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Add condition</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, conditions: [] }), ['combat.conditions']);
            }}
            android_ripple={{ color: '#999' }}
          >
            <Ionicons name='close-circle-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Clear conditions</Text>
          </Pressable>
        </View>
        <Text style={styles.updateMeta}>Current: {(character.conditions || []).join(', ') || 'No conditions'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Spell Slots</Text>
        {!spellSlotEntries.length && <Text style={styles.hint}>No spell slots configured.</Text>}
        {spellSlotEntries.map(([level, slot]) => (
          <View key={level} style={styles.updateRow}>
            <Text style={styles.updateTitle}>Level {level}</Text>
            <Text style={styles.updateMeta}>Used {slot.used}/{slot.max}</Text>
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void commitPatch(
                    (prev) => ({
                      ...prev,
                      spells: {
                        ...prev.spells,
                        spellSlots: {
                          ...prev.spells.spellSlots,
                          [Number(level)]: {
                            max: prev.spells.spellSlots[Number(level)]?.max || 0,
                            used: Math.max(0, (prev.spells.spellSlots[Number(level)]?.used || 0) - 1),
                          },
                        },
                      },
                    }),
                    ['magic.slots'],
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>Used -1</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void commitPatch(
                    (prev) => ({
                      ...prev,
                      spells: {
                        ...prev.spells,
                        spellSlots: {
                          ...prev.spells.spellSlots,
                          [Number(level)]: {
                            max: prev.spells.spellSlots[Number(level)]?.max || 0,
                            used: Math.min(
                              prev.spells.spellSlots[Number(level)]?.max || 0,
                              (prev.spells.spellSlots[Number(level)]?.used || 0) + 1,
                            ),
                          },
                        },
                      },
                    }),
                    ['magic.slots'],
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>Used +1</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  const nextMax = toNumber(String(slot.max), 0) + 1;
                  void commitPatch(
                    (prev) => ({
                      ...prev,
                      spells: {
                        ...prev.spells,
                        spellSlots: {
                          ...prev.spells.spellSlots,
                          [Number(level)]: {
                            max: nextMax,
                            used: Math.min(prev.spells.spellSlots[Number(level)]?.used || 0, nextMax),
                          },
                        },
                      },
                    }),
                    ['magic.slots'],
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>Max +1</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Custom Resources</Text>
        {!(character.customResources || []).length && <Text style={styles.hint}>No custom resources.</Text>}
        {(character.customResources || []).map((resource) => (
          <View key={resource.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{resource.label || 'Resource'}</Text>
            <Text style={styles.updateMeta}>{resource.current}/{resource.max ?? '-'}</Text>
            <View style={styles.laneGrid}>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void commitPatch(
                    (prev) => ({
                      ...prev,
                      customResources: (prev.customResources || []).map((item) =>
                        item.id === resource.id ? { ...item, current: Math.max(0, item.current - 1) } : item,
                      ),
                    }),
                    ['homebrew.resources'],
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>-1</Text>
              </Pressable>
              <Pressable
                style={styles.laneButton}
                onPress={() => {
                  void commitPatch(
                    (prev) => ({
                      ...prev,
                      customResources: (prev.customResources || []).map((item) =>
                        item.id === resource.id
                          ? {
                              ...item,
                              current: Math.min(item.max ?? Number.MAX_SAFE_INTEGER, item.current + 1),
                            }
                          : item,
                      ),
                    }),
                    ['homebrew.resources'],
                  );
                }}
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.laneButtonText}>+1</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Inventory</Text>
        <TextInput
          value={inventoryInput}
          onChangeText={setInventoryInput}
          placeholder='Add inventory item'
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
        />
        <Pressable
          style={styles.laneButton}
          onPress={() => {
            const nextItem = inventoryInput.trim();
            if (!nextItem) return;
            void commitPatch(
              (prev) => ({ ...prev, inventory: [...(prev.inventory || []), nextItem] }),
              ['inventory.items'],
            );
            setInventoryInput('');
          }}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.laneButtonText}>Add item</Text>
        </Pressable>
        {(character.inventory || []).map((item) => (
          <View key={`inv-${item}`} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{item}</Text>
            <Pressable
              style={styles.laneButton}
              onPress={() => {
                void commitPatch(
                  (prev) => ({ ...prev, inventory: (prev.inventory || []).filter((entry) => entry !== item) }),
                  ['inventory.items'],
                );
              }}
              android_ripple={{ color: '#999' }}
            >
              <Text style={styles.laneButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Short Note Append</Text>
        <TextInput
          value={shortNoteInput}
          onChangeText={setShortNoteInput}
          placeholder='Write quick note'
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
          multiline
        />
        <Pressable
          style={styles.laneButton}
          onPress={() => {
            const note = shortNoteInput.trim();
            if (!note) return;
            void commitPatch((prev) => appendQuickSessionNote(prev, note), ['homebrew.notes-groups']);
            setShortNoteInput('');
          }}
          android_ripple={{ color: '#999' }}
        >
          <Text style={styles.laneButtonText}>Append note</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default DMQuickEdit;
