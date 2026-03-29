import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/DM/style';
import type { DMStackParamList } from '@/navigation/DMNavigator';
import type { DMCampaign, DMCampaignNote } from '@/types/DM';
import { ensureCampaignForName, subscribeAccessibleCampaigns } from '@/services/dmCampaigns';
import {
  deleteCampaignNote,
  flushCampaignNotesQueue,
  resolveCampaignNoteConflict,
  subscribeCampaignNotes,
  upsertCampaignNote,
} from '@/services/dmCampaignNotes';
import { fbAuth } from '@/services/firebase';
import useAppRoleStore from '@/context/AppRole-store';
import { getShareDisplayStatus, isNetworkOnline } from '@/shared/helpers/collaboration/status';

type Props = StackScreenProps<DMStackParamList, 'DMCampaignNotes'>;

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
  const [statusText, setStatusText] = useState('Ready');

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

        const fallback = await ensureCampaignForName('Default Campaign');
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
    const title = titleInput.trim();
    const content = contentInput.trim();
    if (!title && !content) return;

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

    setStatusText(`Saved • ${next.syncStatus}`);
    resetEditor();
  };

  const syncNow = async () => {
    await flushCampaignNotesQueue();
    setStatusText('Sync queue flushed');
  };

  const resolveConflict = async (note: DMCampaignNote, strategy: 'keep-local' | 'keep-cloud' | 'merge-manual') => {
    const mergedContent = strategy === 'merge-manual' ? `${note.content}\n\n--- remote ---\n${note.conflictRemote?.content || ''}` : undefined;
    await resolveCampaignNoteConflict(note.id, strategy, mergedContent);
    setStatusText(`Conflict resolved: ${strategy}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Campaign Notes</Text>
        <Text style={styles.hint}>Cloud + offline queue notes with conflict-safe review.</Text>
        <Text style={styles.hint}>Network: {isNetworkOnline(netInfo.isConnected) ? 'Online' : 'Offline'} • {statusText}</Text>

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
                android_ripple={{ color: '#999' }}
              >
                <Text style={styles.statChipText}>{campaign.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.authButton} onPress={() => { void syncNow(); }} android_ripple={{ color: '#999' }}>
          <Text style={styles.authButtonText}>Sync now</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{activeNoteId ? 'Edit Note' : 'New Note'} {selectedCampaign ? `• ${selectedCampaign.name}` : ''}</Text>
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          placeholder='Note title'
          placeholderTextColor={colors.textSecondary}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginBottom: 10 }}
        />
        <TextInput
          value={contentInput}
          onChangeText={setContentInput}
          placeholder='Note content'
          placeholderTextColor={colors.textSecondary}
          multiline
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, minHeight: 120, textAlignVertical: 'top' }}
        />

        <View style={styles.laneGrid}>
          <Pressable style={styles.laneButton} onPress={() => { void saveNote(); }} android_ripple={{ color: '#999' }}>
            <Ionicons name='save-outline' size={18} color={colors.text} />
            <Text style={styles.laneButtonText}>Save note</Text>
          </Pressable>
          {activeNoteId && (
            <Pressable style={styles.laneButton} onPress={resetEditor} android_ripple={{ color: '#999' }}>
              <Ionicons name='close-outline' size={18} color={colors.text} />
              <Text style={styles.laneButtonText}>Cancel edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Recent Edits</Text>
        {!recent.length && <Text style={styles.hint}>No notes for selected campaign.</Text>}
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
              <Text style={styles.updateTitle}>{note.title || 'Untitled note'}</Text>
              <Text style={styles.updateMeta}>Updated: {new Date(note.updatedAtMs).toLocaleString()}</Text>
              <Text style={styles.updateMeta}>Sync status: {displaySyncStatus}</Text>
              {!!shareStatus && <Text style={styles.updateMeta}>Share status: {shareStatus}</Text>}

              {!!note.content && <Text style={styles.updateMeta}>{note.content.slice(0, 140)}</Text>}

              {note.syncStatus === 'Conflict detected' && note.conflictRemote && (
                <View style={styles.laneGrid}>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'keep-local'); }} android_ripple={{ color: '#999' }}>
                    <Text style={styles.laneButtonText}>Keep Local</Text>
                  </Pressable>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'keep-cloud'); }} android_ripple={{ color: '#999' }}>
                    <Text style={styles.laneButtonText}>Keep Cloud</Text>
                  </Pressable>
                  <Pressable style={styles.laneButton} onPress={() => { void resolveConflict(note, 'merge-manual'); }} android_ripple={{ color: '#999' }}>
                    <Text style={styles.laneButtonText}>Merge Manual</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.laneGrid}>
                <Pressable style={styles.laneButton} onPress={() => openNote(note)} android_ripple={{ color: '#999' }}>
                  <Ionicons name='create-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.laneButton}
                  onPress={() => {
                    void deleteCampaignNote(note.id, note.campaignId);
                    if (activeNoteId === note.id) resetEditor();
                  }}
                  android_ripple={{ color: '#999' }}
                >
                  <Ionicons name='trash-outline' size={18} color={colors.text} />
                  <Text style={styles.laneButtonText}>Delete</Text>
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
