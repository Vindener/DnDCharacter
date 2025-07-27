import React, { ReactNode } from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { getStyles } from '@/shared/components/Modal/style';
import useThemeStore from '@/context/Theme-store';

interface ModalProps {
  title?: string;
  subtitle?: string;
  onSubmit?: () => void;
  onClose?: () => void;
  children: ReactNode;
  isVisible: boolean;
}

export const Modal = ({
                        title,
                        subtitle,
                        onSubmit,
                        onClose,
                        children,
                        isVisible,
                      }: ModalProps) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <RNModal visible={isVisible} transparent animationType='fade'>
      <Pressable style={styles.wrapper} onPress={onClose}>
        <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
          <TouchableOpacity onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.content}>
            {children}
            {onSubmit && (
              <Pressable onPress={onSubmit} style={styles.submit}>
                <Text style={styles.submitText}>Submit</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};
