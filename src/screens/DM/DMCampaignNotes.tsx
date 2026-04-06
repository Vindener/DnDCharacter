import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, DMCampaignNote } from '@/types/DM';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/services/dmCampaigns';
import { formatSchemaErrors, safeParseCampaignNoteFormInput } from '@/domain/schemas';
import {
  deleteCampaignNote,
  flushCampaignNotesQueue,
  loadLocalCampaignNotes,
  resolveCampaignNoteConflict,
  subscribeCampaignNotes,
  upsertCampaignNote,
} from '@/services/dmCampaignNotes';
import { fbAuth } from '@/services/firebase';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';

type Props = StackScreenProps<DMStackParamList, 'DMCampaignNotes'>;
type LegacyDMNote = { id: string; title?: string; content?: string; campaign?: string; lastEdited?: number };

const LEGACY_NOTES_KEY = 'DM_NOTES_V2';
const LEGACY_NOTES_MIGRATION_FLAG = 'DM_NOTES_V2_MIGRATED_TO_CAMPAIGN_V1';

const DMCampaignNotes: React.FC<Props> = ({ route }) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const netInfo = useNetInfo();
  const roleMode = useAppRoleStore((s) => s.role);

  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(route.params?.campaignId || '');
  const [notes, setNotes] = useState<DMCampaignNote[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Готово');

  useEffect(() => {
    let cancelled = false;

    const migrateLegacyNotes = async () => {
      try {
        const migrationDone = await AsyncStorage.getItem(LEGACY_NOTES_MIGRATION_FLAG);
        if (migrationDone === '1') return;

        const raw = await AsyncStorage.getItem(LEGACY_NOTES_KEY);
        const parsed = JSON.parse(raw || '[]');
        if (!Array.isArray(parsed) || !parsed.length) {
          await AsyncStorage.setItem(LEGACY_NOTES_MIGRATION_FLAG, '1');
          return;
        }

        const me = fbAuth.currentUser?.uid || 'local';
        let migratedCount = 0;

        for (const entry of parsed as LegacyDMNote[]) {
          if (!entry || typeof entry !== 'object') continue;
          const rawId = String(entry.id || '').trim();
          if (!rawId) continue;

          const campaignName = String(entry.campaign || '').trim() || 'Базова кампанія';
          const campaign = await ensureCampaignForName(campaignName);
          if (!campaign) continue;

          const timestamp = Number(entry.lastEdited || 0) || Date.now();
          await upsertCampaignNote({
            id: `legacy-${rawId}`,
            campaignId: campaign.id,
            title: String(entry.title || '').trim(),
            content: String(entry.content || ''),
            ownerUid: me,
            owners: me ? [me] : [],
            editors: [],
            createdAtMs: timestamp,
            updatedAtMs: timestamp,
            baseUpdatedAtMs: timestamp,
            syncStatus: fbAuth.currentUser ? 'Pending sync' : 'Local only',
          });
          migratedCount += 1;
        }

        await AsyncStorage.removeItem(LEGACY_NOTES_KEY);
        await AsyncStorage.setItem(LEGACY_NOTES_MIGRATION_FLAG, '1');

        if (!cancelled && migratedCount > 0) {
          const localNotes = await loadLocalCampaignNotes();
          if (!cancelled && selectedCampaignId) {
            setNotes(localNotes.filter((note) => note.campaignId === selectedCampaignId));
          }
          if (!cancelled) {
            setStatusText(`Міграцію завершено • Перенесено нотаток: ${migratedCount}`);
          }
        }
      } catch {
        if (!cancelled) {
          setStatusText('Міграцію старих нотаток пропущено');
        }
      }
    };

    void migrateLegacyNotes();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaignId]);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeAccessibleCampaigns(async (next) => {
        if (cancelled) return;
        setCampaigns(next);

        if (selectedCampaignId) return;
        if (next.length) {
          setSelectedCampaignId(next[0].id);
          return;
        }

        const fallback = await ensureCampaignForName('Базова кампанія');
        if (!fallback || cancelled) return;
        setSelectedCampaignId(fallback.id);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [selectedCampaignId]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setNotes([]);
      return;
    }

    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeCampaignNotes(selectedCampaignId, (next) => {
        if (!cancelled) setNotes(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const recent = useMemo(() => notes.slice().sort((a, b) => b.updatedAtMs - a.updatedAtMs).slice(0, 5), [notes]);

  const mergeNoteIntoList = (list: DMCampaignNote[], note: DMCampaignNote): DMCampaignNote[] => {
    const next = [...list.filter((item) => item.id !== note.id), note];
    return next.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  };

  const resetEditor = () => {
    setActiveNoteId(null);
    setTitleInput('');
    setContentInput('');
  };

  const openNote = (note: DMCampaignNote) => {
    setActiveNoteId(note.id);
    setTitleInput(note.title);
    setContentInput(note.content);
  };

  const saveNote = async () => {
    if (!selectedCampaignId) return;
    const formValidation = safeParseCampaignNoteFormInput({
      title: titleInput,
      content: contentInput,
    });
    if (!formValidation.ok) {
      const firstError = formatSchemaErrors(formValidation.issues)[0] || 'Заповніть заголовок або вміст нотатки.';
      setStatusText(firstError);
      return;
    }
    const { title, content } = formValidation.data;

    const current = activeNoteId ? notes.find((item) => item.id === activeNoteId) : null;
    const me = fbAuth.currentUser?.uid || 'local';

    const base: DMCampaignNote = current || {
      id: `note-${Date.now()}`,
      campaignId: selectedCampaignId,
      title: '',
      content: '',
      ownerUid: me,
      owners: me ? [me] : [],
      editors: [],
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      baseUpdatedAtMs: Date.now(),
      syncStatus: fbAuth.currentUser ? 'Pending sync' : 'Local only',
    };

    const next = await upsertCampaignNote({
      ...base,
      title,
      content,
    });

    // Show saved note immediately in the list, without waiting for subscription roundtrip.
    setNotes((prev) => mergeNoteIntoList(prev, next));
    setStatusText(`Збережено • ${next.syncStatus}`);
    resetEditor();
  };

  const syncNow = async () => {
    await flushCampaignNotesQueue();
    setStatusText('Чергу синхронізації очищено');
  };

  const resolveConflict = async (note: DMCampaignNote, strategy: 'keep-local' | 'keep-cloud' | 'merge-manual') => {
    const mergedContent = strategy === 'merge-manual' ? `${note.content}\n\n--- remote ---\n${note.conflictRemote?.content || ''}` : undefined;
    const resolved = await resolveCampaignNoteConflict(note.id, strategy, mergedContent);
    if (resolved) {
      setNotes((prev) => mergeNoteIntoList(prev, resolved));
    }
    setStatusText(`Конфлікт вирішено: ${strategy}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Нотатки кампанії</Text>
        <Text style={styles.hint}>Нотатки з хмарною та офлайн-чергою і безпечним переглядом конфліктів.</Text>
        <Text style={styles.hint}>Мережа: {isNetworkOnline(netInfo.isConnected) ? 'Онлайн' : 'Офлайн'} • {statusText}</Text>

        <View style={styles.statsRow}>
          {campaigns.map((campaign) => {
            const active = campaign.id === selectedCampaignId;
            return (
              <Pressable
                key={campaign.id}
                style={[styles.statChip, active ? { borderColor: colors.text } : null]}
                onPress={() => {
                  setSelectedCampaignId(campaign.id);
                  resetEditor();
                }}
                android_ripple={{ color: colors.ripple }}
              >
                <Text style={styles.statChipText}>{campaign.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.authButton} onPress={() => { void syncNow(); }} android_ripple={{ color: colors.ripple }}>
          <Text style={styles.authButtonText}>Синхронізувати зараз</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{activeNoteId ? 'Редагувати нотатку' : 'Нова нотатка'} {selectedCampaign ? `• ${selectedCampaign.name}` : ''}</Text>
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          placeholder='Заголовок нотатки'
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginBottom: 10 }}
        />
        <TextInput
          value={contentInput}
          onChangeText={setContentInput}
          placeholder='Вміст нотатки'
          placeholderTextColor={colors.textSecondary}
          multiline
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, minHeight: 120, textAlignVertical: 'top' }}
        />

        <View style={styles.laneGrid}>
          <Pressable style={styles.laneButton} onPress={() => { void saveNote(); }} android_ripple={{ color: colors.ripple }}>
            <Ionicons name='save-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Зберегти нотатку</Text>
          </Pressable>
          {activeNoteId && (
            <Pressable style={styles.laneButton} onPress={resetEditor} android_ripple={{ color: colors.ripple }}>
              <Ionicons name='close-outline' size={18} color={colors.text} />
              <Text style={styles.laneButtonText}>Скасувати редагування</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Останні зміни</Text>
        {!recent.length && <Text style={styles.hint}>Для вибраної кампанії нотаток немає.</Text>}
        {recent.map((note) => {
          const displaySyncStatus =
            note.syncStatus === 'Pending sync' && !isNetworkOnline(netInfo.isConnected)
              ? 'Offline changes pending'
              : note.syncStatus;
          const shareStatus = getShareDisplayStatus({
            isSharedSheet: note.editors.length > 0,
            role: roleMode,
            source: 'mine',
          });

          return (
            <View key={note.id} style={styles.updateRow}>
              <Text style={styles.updateTitle}>{note.title || 'Нотатка без назви'}</Text>
              <Text style={styles.updateMeta}>Оновлено: {new Date(note.updatedAtMs).toLocaleString()}</Text>
              <Text style={styles.updateMeta}>Статус синхронізації: {displaySyncStatus}</Text>
              {!!shareStatus && <Text style={styles.updateMeta}>Статус спільного доступу: {shareStatus}</Text>}

              {!!note.content && <Text style={styles.updateMeta}>{note.content.slice(0, 140)}</Text>}

              {note.syncStatus === 'Conflict detected' && note.conflictRemote && (
                <View style={styles.laneGrid}>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'keep-local'); }} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.laneButtonText}>Залишити локальну</Text>
                  </Pressable>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'keep-cloud'); }} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.laneButtonText}>Залишити хмарну</Text>
                  </Pressable>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'merge-manual'); }} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.laneButtonText}>Об’єднати вручну</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.laneGrid}>
                <Pressable style={styles.laneButton} onPress={() => openNote(note)} android_ripple={{ color: colors.ripple }}>
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Редагувати</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    setNotes((prev) => prev.filter((item) => item.id !== note.id));
                    void deleteCampaignNote(note.id, note.campaignId);
                    if (activeNoteId === note.id) resetEditor();
                  }}
                  android_ripple={{ color: colors.ripple }}
                >
                  <Ionicons name='trash-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Видалити</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default DMCampaignNotes;

