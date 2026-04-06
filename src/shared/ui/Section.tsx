import React from 'react';
import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { sp } from '@/shared/styles/tokens';
import { Text } from '@/shared/ui/Text';

export interface SectionProps extends ViewProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, action, style, children, ...rest }) => {
  return (
    <View style={[styles.section, style]} {...rest}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.headTextWrap}>
            {title ? <Text variant='title' weight='bold'>{title}</Text> : null}
            {subtitle ? <Text variant='bodySm' tone='secondary'>{subtitle}</Text> : null}
          </View>
          {action ? <View>{action}</View> : null}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: sp(8),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: sp(8),
  },
  headTextWrap: {
    flex: 1,
    gap: sp(2),
  },
  content: {
    gap: sp(8),
  },
});

export default Section;

