import React, { ReactNode } from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { getStyles } from '@/shared/components/Modal/style';
import useThemeStore from '@/context/Theme-store';
import { Button, Text } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  title?: string;
  subtitle?: string;
  onSubmit?: () => void;
  onClose?: () => void;
  scrollToTopSignal?: number;
  children: ReactNode;
  isVisible: boolean;
}

export const Modal = ({ title, subtitle, onSubmit, onClose, scrollToTopSignal = 0, children, isVisible }: ModalProps) => {
  const { t } = useTranslation('common');
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const scrollRef = React.useRef<KeyboardAwareScrollViewRef>(null);

  React.useEffect(() => {
    if (!isVisible || scrollToTopSignal === 0) return;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [isVisible, scrollToTopSignal]);

  return (
    <RNModal visible={isVisible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.container}>
          <Pressable onPress={onClose} style={styles.close} android_ripple={{ color: colors.ripple }}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>
            <KeyboardAwareScrollView
              ref={scrollRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              bottomOffset={16}
            >
              {children}
            </KeyboardAwareScrollView>
            {onSubmit ? (
              <View style={styles.actions}>
                <Button title={t('actions.save')} variant='primary' onPress={onSubmit} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </RNModal>
  );
};
