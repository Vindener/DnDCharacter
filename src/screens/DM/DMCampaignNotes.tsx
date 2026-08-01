import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, DMCampaignNote, DMCampaignNoteKind } from '@/dm/domain/types';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import { formatSchemaErrors, safeParseCampaignNoteFormInput } from '@/domain/schemas';
import { rd, sp } from '@/shared/styles/tokens';
import {
  deleteCampaignNote,
  flushCampaignNotesQueue,
  loadLocalCampaignNotes,
  resolveCampaignNoteConflict,
  subscribeCampaignNotes,
  upsertCampaignNote,
} from '@/dm/repositories/campaignNotesRepository';
import { fbAuth } from '@/services/firebase';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';

type Props = StackScreenProps<DMStackParamList, 'DMCampaignNotes'>;
const DMCampaignNotes: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation(['dm', 'common']);
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
  const [statusText, setStatusText] = useState(t('dm:campaignNotes.ready'));
  const [kindInput, setKindInput] = useState<DMCampaignNoteKind>('note');
  const [kindFilter, setKindFilter] = useState<'all' | DMCampaignNoteKind>('all');

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

        const fallback = await ensureCampaignForName(t('dm:campaignNotes.defaultCampaign'));
        if (!fallback || cancelled) return;
        setSelectedCampaignId(fallback.id);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [selectedCampaignId, t]);

  useEffect(() => {
    if (!selectedCampaignId) {
      setNotes([]);
      return;
    }

    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      const local = await loadLocalCampaignNotes();
      if (!cancelled) setNotes(local.filter((note) => note.campaignId === selectedCampaignId));

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

  const recent = useMemo(
    () =>
      notes
        .filter((note) => kindFilter === 'all' || (note.kind || 'note') === kindFilter)
        .slice()
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
        .slice(0, 5),
    [kindFilter, notes],
  );

  const mergeNoteIntoList = (list: DMCampaignNote[], note: DMCampaignNote): DMCampaignNote[] => {
    const next = [...list.filter((item) => item.id !== note.id), note];
    return next.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  };

  const resetEditor = () => {
    setActiveNoteId(null);
    setTitleInput('');
    setContentInput('');
    setKindInput('note');
  };

  const openNote = (note: DMCampaignNote) => {
    setActiveNoteId(note.id);
    setTitleInput(note.title);
    setContentInput(note.content);
    setKindInput(note.kind || 'note');
  };

  const saveNote = async () => {
    if (!selectedCampaignId) return;
    const formValidation = safeParseCampaignNoteFormInput({
      title: titleInput,
      content: contentInput,
    });
    if (!formValidation.ok) {
      const firstError = formatSchemaErrors(formValidation.issues)[0] || t('dm:campaignNotes.validationFallback');
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
      kind: kindInput,
    });

    // Show saved note immediately in the list, without waiting for subscription roundtrip.
    setNotes((prev) => mergeNoteIntoList(prev, next));
    setStatusText(t('dm:campaignNotes.saved', { status: formatSyncStatus(next.syncStatus) }));
    resetEditor();
  };

  const syncNow = async () => {
    await flushCampaignNotesQueue();
    setStatusText(t('dm:campaignNotes.queueFlushed'));
  };

  const resolveConflict = async (note: DMCampaignNote, strategy: 'keep-local' | 'keep-cloud' | 'merge-manual') => {
    const mergedContent =
      strategy === 'merge-manual' ? `${note.content}\n\n--- remote ---\n${note.conflictRemote?.content || ''}` : undefined;
    const resolved = await resolveCampaignNoteConflict(note.id, strategy, mergedContent);
    if (resolved) {
      setNotes((prev) => mergeNoteIntoList(prev, resolved));
    }
    setStatusText(t('dm:campaignNotes.conflictResolved', { strategy: t(`dm:campaignNotes.strategies.${strategy}`) }));
  };

  const formatSyncStatus = (status: string) => {
    if (status === 'Synced') return t('common:status.synced');
    if (status === 'Pending sync') return t('common:status.pendingSync');
    if (status === 'Offline changes pending') return t('common:status.offlineChanges');
    if (status === 'Conflict detected') return t('common:status.conflictDetected');
    if (status === 'Local only') return t('common:status.localOnly');
    return status;
  };

  const formatShareStatus = (status: string) => {
    if (status === 'Shared with DM') return t('common:status.sharedWithDm');
    if (status === 'Shared with Player') return t('common:status.sharedWithPlayer');
    return status;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignNotes.title')}</Text>
        <Text style={styles.hint}>{t('dm:campaignNotes.hint')}</Text>
        <Text style={styles.hint}>
          {t('dm:campaignNotes.networkStatus', {
            network: isNetworkOnline(netInfo.isConnected) ? t('common:status.online') : t('common:status.offline'),
            status: statusText,
          })}
        </Text>

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

        <Pressable
          style={styles.authButton}
          onPress={() => {
            void syncNow();
          }}
          android_ripple={{ color: colors.ripple }}
        >
          <Text style={styles.authButtonText}>{t('dm:campaignNotes.syncNow')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>
          {activeNoteId ? t('dm:campaignNotes.editTitle') : t('dm:campaignNotes.newTitle')}{' '}
          {selectedCampaign ? `• ${selectedCampaign.name}` : ''}
        </Text>
        <View style={styles.statsRow}>
          {(['note', 'session', 'loot'] as const).map((kind) => (
            <Pressable
              key={kind}
              style={[styles.statChip, kindInput === kind ? { borderColor: colors.text } : null]}
              onPress={() => setKindInput(kind)}
              android_ripple={{ color: colors.ripple }}
              testID={`campaignNotes.kindInput.${kind}`}
            >
              <Text style={styles.statChipText}>{t(`dm:campaignNotes.kind.${kind}`)}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          placeholder={t('dm:campaignNotes.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: rd(8),
            padding: sp(10),
            color: colors.text,
            marginBottom: sp(10),
          }}
        />
        <TextInput
          value={contentInput}
          onChangeText={setContentInput}
          placeholder={kindInput === 'loot' ? t('dm:campaignNotes.kind.lootPlaceholder') : t('dm:campaignNotes.contentPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: rd(8),
            padding: sp(10),
            color: colors.text,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
        />

        <View style={styles.laneGrid}>
          <Pressable
            style={styles.laneButton}
            onPress={() => {
              void saveNote();
            }}
            android_ripple={{ color: colors.ripple }}
          >
            <Ionicons name='save-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>{t('dm:campaignNotes.save')}</Text>
          </Pressable>
          {activeNoteId && (
            <Pressable style={styles.laneButton} onPress={resetEditor} android_ripple={{ color: colors.ripple }}>
              <Ionicons name='close-outline' size={18} color={colors.text} />
              <Text style={styles.laneButtonText}>{t('dm:campaignNotes.cancelEdit')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('dm:campaignNotes.recentChanges')}</Text>
        <View style={styles.statsRow}>
          {(['all', 'note', 'session', 'loot'] as const).map((kind) => (
            <Pressable
              key={kind}
              style={[styles.statChip, kindFilter === kind ? { borderColor: colors.text } : null]}
              onPress={() => setKindFilter(kind)}
              android_ripple={{ color: colors.ripple }}
              testID={`campaignNotes.kindFilter.${kind}`}
            >
              <Text style={styles.statChipText}>{t(`dm:campaignNotes.kind.filter.${kind}`)}</Text>
            </Pressable>
          ))}
        </View>
        {!recent.length && <Text style={styles.hint}>{t('dm:campaignNotes.empty')}</Text>}
        {recent.map((note) => {
          const displaySyncStatus =
            note.syncStatus === 'Pending sync' && !isNetworkOnline(netInfo.isConnected) ? 'Offline changes pending' : note.syncStatus;
          const shareStatus = getShareDisplayStatus({
            isSharedSheet: note.editors.length > 0,
            role: roleMode,
            source: 'mine',
          });

          return (
            <View key={note.id} style={styles.updateRow}>
              <Text style={styles.updateTitle}>{note.title || t('dm:campaignNotes.untitled')}</Text>
              <Text style={styles.updateMeta}>{t(`dm:campaignNotes.kind.${note.kind || 'note'}`)}</Text>
              <Text style={styles.updateMeta}>{t('dm:campaignNotes.updated', { value: new Date(note.updatedAtMs).toLocaleString() })}</Text>
              <Text style={styles.updateMeta}>{t('dm:campaignNotes.syncStatus', { status: formatSyncStatus(displaySyncStatus) })}</Text>
              {!!shareStatus && (
                <Text style={styles.updateMeta}>{t('dm:campaignNotes.shareStatus', { status: formatShareStatus(shareStatus) })}</Text>
              )}

              {!!note.content && <Text style={styles.updateMeta}>{note.content.slice(0, 140)}</Text>}

              {note.syncStatus === 'Conflict detected' && note.conflictRemote && (
                <View style={styles.laneGrid}>
                  <Pressable
                    style={styles.laneButton}
                    onPress={() => {
                      void resolveConflict(note, 'keep-local');
                    }}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.laneButtonText}>{t('dm:campaignNotes.keepLocal')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.laneButton}
                    onPress={() => {
                      void resolveConflict(note, 'keep-cloud');
                    }}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.laneButtonText}>{t('dm:campaignNotes.keepCloud')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.laneButton}
                    onPress={() => {
                      void resolveConflict(note, 'merge-manual');
                    }}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.laneButtonText}>{t('dm:campaignNotes.mergeManual')}</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.laneGrid}>
                <Pressable style={styles.laneButton} onPress={() => openNote(note)} android_ripple={{ color: colors.ripple }}>
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>{t('dm:campaignNotes.edit')}</Text>
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
                  <Text style={styles.laneButtonText}>{t('dm:campaignNotes.delete')}</Text>
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
