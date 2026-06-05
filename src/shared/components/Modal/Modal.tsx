import React, { ReactNode } from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { getStyles } from '@/shared/components/Modal/style';
import useThemeStore from '@/context/Theme-store';
import { Button, Text } from '@/shared/ui';

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
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const scrollRef = React.useRef<ScrollView>(null);

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
            <ScrollView
              ref={scrollRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              {children}
            </ScrollView>
            {onSubmit ? (
              <View style={styles.actions}>
                <Button title='Зберегти' variant='primary' onPress={onSubmit} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </RNModal>
  );
};
