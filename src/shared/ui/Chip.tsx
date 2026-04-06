import React from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { rd, sp } from '@/shared/styles/tokens';
import { Text } from '@/shared/ui/Text';

export type ChipTone = 'default' | 'brand' | 'danger' | 'success';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  size?: ChipSize;
  style?: ViewStyle | ViewStyle[];
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  tone = 'default',
  size = 'md',
  style,
  android_ripple,
  ...rest
}) => {
  const colors = useThemeStore((s) => s.colors);
  const tones = {
    default: { activeBg: colors.text, activeText: colors.background, idleBg: colors.background, idleText: colors.text },
    brand: { activeBg: colors.brand, activeText: colors.onBrand, idleBg: colors.background, idleText: colors.brand },
    danger: { activeBg: colors.danger, activeText: colors.onDanger, idleBg: colors.background, idleText: colors.danger },
    success: { activeBg: colors.success, activeText: colors.onSuccess, idleBg: colors.background, idleText: colors.success },
  } as const;

  const scale = size === 'sm' ? { py: sp(4), px: sp(8), variant: 'bodySm' as const } : { py: sp(6), px: sp(10), variant: 'body' as const };

  const theme = tones[tone];

  return (
    <Pressable
      android_ripple={android_ripple ?? { color: colors.ripple }}
      style={[
        styles.base,
        {
          borderColor: selected ? theme.activeBg : colors.border,
          backgroundColor: selected ? theme.activeBg : theme.idleBg,
          paddingVertical: scale.py,
          paddingHorizontal: scale.px,
        },
        style,
      ]}
      {...rest}
    >
      <View>
        <Text variant={scale.variant} weight='semibold' style={{ color: selected ? theme.activeText : theme.idleText }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: rd('pill'),
    alignSelf: 'flex-start',
  },
});

export default Chip;

