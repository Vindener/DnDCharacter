import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import useThemeStore from '@/context/Theme-store';
import { getStyles } from '@/screens/Settings/styles';
import { logout } from '@/shared/services/auth';
import {
  AccountDeletionError,
  buildTransferKey,
  previewAccountDeletion,
  requestAccountDeletion,
  type AccountDeletionPreview,
  type AccountDeletionPreviewItem,
} from '@/services/accountDeletion';

type Phase = 'closed' | 'loadingPreview' | 'preview' | 'processing' | 'success' | 'partial' | 'error';

function previewActionKey(action: AccountDeletionPreviewItem['action']['type']): string {
  switch (action) {
    case 'delete':
      return 'previewDelete';
    case 'transferOwnership':
      return 'previewTransfer';
    case 'removeFromOwners':
      return 'previewRemoveFromOwners';
    case 'removeFromEditors':
      return 'previewRemoveFromEditors';
    default:
      return 'previewDelete';
  }
}

export default function DeleteAccountModal() {
  const { t } = useTranslation('settings');
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  useEffect(() => auth().onAuthStateChanged(setUser), []);

  const [phase, setPhase] = useState<Phase>('closed');
  const [preview, setPreview] = useState<AccountDeletionPreview | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = useCallback(() => {
    setPhase('closed');
    setPreview(null);
    setSelections({});
    setConfirmed(false);
    setErrorMessage('');
  }, []);

  const openFlow = useCallback(async () => {
    setPhase('loadingPreview');
    try {
      const result = await previewAccountDeletion();
      setPreview(result);
      setPhase('preview');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, []);

  const canConfirm =
    confirmed && !!preview && preview.needsOwnerChoice.every((item) => Boolean(selections[buildTransferKey(item.collection, item.id)]));

  const runDeletion = useCallback(async () => {
    setPhase('processing');
    try {
      const response = await requestAccountDeletion(selections);
      if (response.status === 'partial') {
        setPhase('partial');
      } else {
        setPhase('success');
      }
      await logout().catch(() => {});
    } catch (err: unknown) {
      const message =
        err instanceof AccountDeletionError && err.code === 'reauth-failed'
          ? t('settings:account.dangerZone.reauthCancelled')
          : err instanceof Error
            ? err.message
            : String(err);
      setErrorMessage(message);
      setPhase('error');
    }
  }, [selections, t]);

  if (!user) return null;

  return (
    <View style={styles.dangerCard}>
      <Text style={styles.sectionTitle}>{t('settings:account.dangerZone.title')}</Text>
      <Text style={styles.sectionHint}>{t('settings:account.dangerZone.hint')}</Text>
      <Pressable onPress={openFlow} style={styles.dangerButton} android_ripple={{ color: colors.ripple }} accessibilityRole='button'>
        <Text style={styles.dangerButtonText}>{t('settings:account.dangerZone.deleteButton')}</Text>
      </Pressable>

      <Modal visible={phase !== 'closed'} transparent animationType='fade' onRequestClose={reset}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {phase === 'loadingPreview' && (
              <View>
                <ActivityIndicator color={colors.brand} />
                <Text style={styles.modalLabel}>{t('settings:account.dangerZone.loadingPreview')}</Text>
              </View>
            )}

            {phase === 'preview' && preview && (
              <>
                <Text style={styles.modalTitle}>{t('settings:account.dangerZone.previewTitle')}</Text>
                {preview.items.length === 0 ? (
                  <Text style={styles.modalLabel}>{t('settings:account.dangerZone.previewEmpty')}</Text>
                ) : (
                  <ScrollView style={styles.previewList}>
                    {preview.items.map((item) => {
                      const transferKey = buildTransferKey(item.collection, item.id);
                      const selected = selections[transferKey];
                      return (
                        <View key={transferKey} style={styles.previewItem}>
                          <Text style={styles.previewItemLabel}>{item.label}</Text>
                          {item.action.type === 'transferOwnership' && item.editorCandidates && item.editorCandidates.length > 1 ? (
                            <>
                              <Text style={styles.previewItemAction}>
                                {t('settings:account.dangerZone.chooseNewOwner', { label: item.label })}
                              </Text>
                              <View style={styles.ownerChoiceRow}>
                                {item.editorCandidates.map((candidate) => (
                                  <Pressable
                                    key={candidate.uid}
                                    onPress={() => setSelections((prev) => ({ ...prev, [transferKey]: candidate.uid }))}
                                    style={[styles.ownerChoiceOption, selected === candidate.uid ? styles.ownerChoiceOptionSelected : null]}
                                    android_ripple={{ color: colors.ripple }}
                                  >
                                    <Text style={styles.ownerChoiceOptionText}>{candidate.email}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            </>
                          ) : (
                            <Text style={styles.previewItemAction}>
                              {item.action.type === 'transferOwnership' && item.editorCandidates?.[0]
                                ? t('settings:account.dangerZone.previewTransfer', { email: item.editorCandidates[0].email })
                                : t(`settings:account.dangerZone.${previewActionKey(item.action.type)}`)}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}

                <Pressable
                  onPress={() => setConfirmed((prev) => !prev)}
                  style={styles.checkboxRow}
                  accessibilityRole='checkbox'
                  accessibilityState={{ checked: confirmed }}
                >
                  <View style={[styles.checkbox, confirmed ? styles.checkboxChecked : null]}>
                    {confirmed ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('settings:account.dangerZone.confirmCheckbox')}</Text>
                </Pressable>

                <View style={styles.modalActions}>
                  <Pressable onPress={reset} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.modalButtonText}>{t('settings:account.dangerZone.cancelButton')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={runDeletion}
                    disabled={!canConfirm}
                    style={[styles.modalButton, !canConfirm ? { opacity: 0.5 } : null]}
                    android_ripple={{ color: colors.ripple }}
                  >
                    <Text style={styles.modalButtonText}>{t('settings:account.dangerZone.confirmButton')}</Text>
                  </Pressable>
                </View>
              </>
            )}

            {phase === 'processing' && (
              <View>
                <ActivityIndicator color={colors.brand} />
                <Text style={styles.modalLabel}>{t('settings:account.dangerZone.deletingInProgress')}</Text>
              </View>
            )}

            {phase === 'success' && (
              <>
                <Text style={styles.modalTitle}>{t('settings:account.dangerZone.successTitle')}</Text>
                <Text style={styles.modalLabel}>{t('settings:account.dangerZone.successMessage')}</Text>
                <Pressable onPress={reset} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                  <Text style={styles.modalButtonText}>{t('common:actions.close', { defaultValue: 'OK' })}</Text>
                </Pressable>
              </>
            )}

            {phase === 'partial' && (
              <>
                <Text style={styles.modalTitle}>{t('settings:account.dangerZone.partialFailureTitle')}</Text>
                <Text style={styles.modalLabel}>{t('settings:account.dangerZone.partialFailureMessage')}</Text>
                <Pressable onPress={reset} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                  <Text style={styles.modalButtonText}>{t('common:actions.close', { defaultValue: 'OK' })}</Text>
                </Pressable>
              </>
            )}

            {phase === 'error' && (
              <>
                <Text style={styles.modalTitle}>{t('settings:account.dangerZone.errorTitle')}</Text>
                <Text style={styles.modalLabel}>{errorMessage || t('settings:account.dangerZone.errorMessage')}</Text>
                <View style={styles.modalActions}>
                  <Pressable onPress={reset} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.modalButtonText}>{t('settings:account.dangerZone.cancelButton')}</Text>
                  </Pressable>
                  <Pressable onPress={openFlow} style={styles.modalButton} android_ripple={{ color: colors.ripple }}>
                    <Text style={styles.modalButtonText}>{t('settings:account.dangerZone.deleteButton')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
