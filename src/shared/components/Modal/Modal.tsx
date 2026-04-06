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
  children: ReactNode;
  isVisible: boolean;
}

export const Modal = ({ title, subtitle, onSubmit, onClose, children, isVisible }: ModalProps) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

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
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              {children}
              {onSubmit ? <Button title='Зберегти' variant='primary' onPress={onSubmit} /> : null}
            </ScrollView>
          </View>
        </View>
      </View>
    </RNModal>
  );
};
