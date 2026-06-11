import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import useCharacterStore from '@/context/Character-store';
import useSyncStore from '@/context/Sync-store';
import { appendQuickSessionNote } from '@/shared/helpers/homebrew';
import type { CharacterViewModel } from '@/types/Character';
import { fbAuth } from '@/services/firebase';
import { Modal } from '@/shared/components/Modal/Modal';
import { syncToCloud } from '@/services/characterSyncCoordinator';
import { rd, sp } from '@/shared/styles/tokens';

type Props = StackScreenProps<DMStackParamList, 'DMQuickEdit'>;

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DMQuickEdit: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation('dm');
  const { characterId } = route.params;
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const character = useCharacterStore((s) => s.characters.find((item) => item.id === characterId));
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const setCurrentCharacterId = useCharacterStore((s) => s.setCurrentCharacterId);

  const markLocalDraftPaths = useSyncStore((s) => s.markLocalDraftPaths);
  const ensureCharacterSync = useSyncStore((s) => s.ensureCharacterSync);
  const setCloudAvailability = useSyncStore((s) => s.setCloudAvailability);
  const markCloudUploaded = useSyncStore((s) => s.markCloudUploaded);
  const setSyncTransport = useSyncStore((s) => s.setSyncTransport);
  const markSyncError = useSyncStore((s) => s.markSyncError);

  const [conditionInput, setConditionInput] = useState('');
  const [inventoryInput, setInventoryInput] = useState('');
  const [shortNoteInput, setShortNoteInput] = useState('');
  const [syncFeedback, setSyncFeedback] = useState(t('quickEdit.ready'));
  const [isHpModalVisible, setIsHpModalVisible] = useState(false);
  const [tempCurrentHp, setTempCurrentHp] = useState('');
  const [tempMaxHp, setTempMaxHp] = useState('');
  const [tempTempHp, setTempTempHp] = useState('');

  const commitPatch = async (buildNext: (prev: CharacterViewModel) => CharacterViewModel, paths: string[]) => {
    const current = useCharacterStore.getState().characters.find((item) => item.id === characterId);
    if (!current) return;

    const next = buildNext(current);
    await updateCharacter(current.id, next);
    await markLocalDraftPaths(current.id, paths);

    const isSignedIn = Boolean(fbAuth.currentUser);
    await ensureCharacterSync(current.id, isSignedIn);

    if (!isSignedIn) {
      setSyncFeedback(t('quickEdit.savedLocal'));
      return;
    }

    const result = await syncToCloud({
      character: next,
      syncState: useSyncStore.getState().syncByCharacter[current.id],
      actorRole: 'DM',
      syncPort: {
        ensureCharacterSync,
        setCloudAvailability,
        markCloudUploaded,
        setSyncTransport,
        markSyncError,
      },
      isOnline: true,
      historyPaths: paths,
      syncingMessage: t('quickEdit.syncing'),
      syncedMessage: t('quickEdit.synced'),
      conflictFallbackPath: paths[0] || 'overview.identity',
    });

    if (result.status === 'synced') {
      setSyncFeedback(t('quickEdit.synced'));
      return;
    }

    if (result.status === 'error') {
      setSyncFeedback(result.message || t('quickEdit.syncError'));
      return;
    }

    setSyncFeedback(t('quickEdit.offlineQueue'));
  };

  const spellSlotEntries = useMemo(() => {
    if (!character) return [] as Array<[string, { max: number; used: number }]>;
    return Object.entries(character.spells?.spellSlots || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [character]);

  const openFullEdit = () => {
    if (!character) return;
    setCurrentCharacterId(character.id);
    const parent = navigation.getParent();
    if (!parent) return;
    parent.dispatch(
      CommonActions.navigate({
        name: 'Heroes',
        params: { screen: 'Character', params: { character } },
      }),
    );
  };

  const openHpModal = () => {
    if (!character) return;
    setTempCurrentHp(String(character.hp?.current || 0));
    setTempMaxHp(String(character.hp?.max || 1));
    setTempTempHp(String(character.hp?.temp || 0));
    setIsHpModalVisible(true);
  };

  const saveHpModal = () => {
    if (!character) return;
    const currentFallback = character.hp?.current || 0;
    const maxFallback = Math.max(1, character.hp?.max || 1);
    const tempFallback = character.hp?.temp || 0;
    const nextMax = Math.max(1, toNumber(tempMaxHp, maxFallback));
    const nextCurrent = Math.min(nextMax, Math.max(0, toNumber(tempCurrentHp, currentFallback)));
    const nextTemp = Math.max(0, toNumber(tempTempHp, tempFallback));

    void commitPatch(
      (prev) => ({
        ...prev,
        hp: {
          ...prev.hp,
          max: nextMax,
          current: nextCurrent,
          temp: nextTemp,
        },
      }),
      ['combat.hp'],
    );
    setIsHpModalVisible(false);
  };

  if (!character) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{t('quickEdit.title')}</Text>
            <Text style={styles.hint}>{t('quickEdit.notFound')}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.titleWithName', { name: character.name || t('quickEdit.characterFallback') })}</Text>
        <Text style={styles.hint}>{t('quickEdit.hint')}</Text>
        <Text style={styles.hint}>{t('quickEdit.status', { status: syncFeedback })}</Text>
        <Pressable style={styles.topActionButton} onPress={openFullEdit} android_ripple={{ color: colors.ripple }}>
          <Ionicons name='document-text-outline' size={18} color={colors.text} />
          <Text style={styles.topActionButtonText}>{t('quickEdit.openFullEdit')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.coreTitle')}</Text>
        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch(
                (prev) => ({ ...prev, hp: { ...prev.hp, current: Math.max(0, (prev.hp?.current || 0) - 1) } }),
                ['combat.hp'],
              );
            }}
            android_ripple={{ color: colors.ripple }}
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
            android_ripple={{ color: colors.ripple }}
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
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='shield-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('quickEdit.tempHpPlus')}</Text>
          </Pressable>
          <Pressable style={styles.laneButton} onPress={openHpModal} android_ripple={{ color: colors.ripple }}>
            <Ionicons name='create-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('quickEdit.changeHp')}</Text>
          </Pressable>
        </View>

        <Text style={styles.updateMeta}>{t('quickEdit.hpLine', { current: character.hp?.current || 0, max: character.hp?.max || 0, temp: character.hp?.temp || 0 })}</Text>
        <Text style={styles.updateMeta}>{t('quickEdit.acInitiativeLine', { ac: character.ac || 0, initiative: character.initiative || 0 })}</Text>

        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, ac: (prev.ac || 0) + 1 }), ['combat.core']);
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='add-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>AC +1</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, initiative: (prev.initiative || 0) + 1 }), ['combat.core']);
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='flash-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('quickEdit.initiativePlus')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.conditions')}</Text>
        <TextInput
          value={conditionInput}
          onChangeText={setConditionInput}
          placeholder={t('quickEdit.conditionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: rd(8), padding: sp(10), color: colors.text }}
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
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='add-circle-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('quickEdit.addCondition')}</Text>
          </Pressable>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void commitPatch((prev) => ({ ...prev, conditions: [] }), ['combat.conditions']);
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='close-circle-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('quickEdit.clearConditions')}</Text>
          </Pressable>
        </View>
        <Text style={styles.updateMeta}>{t('quickEdit.currentConditions', { conditions: (character.conditions || []).join(', ') || t('quickEdit.noConditions') })}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.spellSlots')}</Text>
        {!spellSlotEntries.length && <Text style={styles.hint}>{t('quickEdit.noSpellSlots')}</Text>}
        {spellSlotEntries.map(([level, slot]) => (
          <View key={level} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{t('quickEdit.level', { level })}</Text>
            <Text style={styles.updateMeta}>{t('quickEdit.usedSlots', { used: slot.used, max: slot.max })}</Text>
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
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>{t('quickEdit.usedMinus')}</Text>
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
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>{t('quickEdit.usedPlus')}</Text>
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
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>{t('quickEdit.maxPlus')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.customResources')}</Text>
        {!(character.customResources || []).length && <Text style={styles.hint}>{t('quickEdit.noCustomResources')}</Text>}
        {(character.customResources || []).map((resource) => (
          <View key={resource.id} style={styles.updateRow}>
            <Text style={styles.updateTitle}>{resource.label || t('quickEdit.resourceFallback')}</Text>
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
                android_ripple={{ color: colors.ripple }}
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
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.laneButtonText}>+1</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.inventory')}</Text>
        <TextInput
          value={inventoryInput}
          onChangeText={setInventoryInput}
          placeholder={t('quickEdit.inventoryPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: rd(8), padding: sp(10), color: colors.text }}
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
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.laneButtonText}>{t('quickEdit.addItem')}</Text>
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
              android_ripple={{ color: colors.ripple }}
            >
              <Text style={styles.laneButtonText}>{t('quickEdit.delete')}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('quickEdit.quickNote')}</Text>
        <TextInput
          value={shortNoteInput}
          onChangeText={setShortNoteInput}
          placeholder={t('quickEdit.quickNotePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: rd(8), padding: sp(10), color: colors.text }}
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
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.laneButtonText}>{t('quickEdit.addNote')}</Text>
        </Pressable>
      </View>

      <Modal isVisible={isHpModalVisible} onClose={() => setIsHpModalVisible(false)} onSubmit={saveHpModal} title={t('quickEdit.changeHpTitle')}>
        <Text style={styles.modalLabel}>{t('quickEdit.currentHp')}</Text>
        <TextInput
          value={tempCurrentHp}
          onChangeText={setTempCurrentHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder={t('quickEdit.currentHp')}
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.modalLabel}>{t('quickEdit.maxHp')}</Text>
        <TextInput
          value={tempMaxHp}
          onChangeText={setTempMaxHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder={t('quickEdit.maxHp')}
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.modalLabel}>{t('quickEdit.tempHp')}</Text>
        <TextInput
          value={tempTempHp}
          onChangeText={setTempTempHp}
          keyboardType='number-pad'
          style={styles.modalInput}
          placeholder={t('quickEdit.tempHp')}
          placeholderTextColor={colors.textSecondary}
        />
      </Modal>
    </ScrollView>
  );
};

export default DMQuickEdit;



