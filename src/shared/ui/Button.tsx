import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { rd, sp } from '@/shared/styles/tokens';
import { Text } from '@/shared/ui/Text';
import { resolveButtonVariant as resolveVariant } from '@/shared/ui/variantResolvers';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const sizeMap = {
  sm: { py: sp(8), px: sp(10), textVariant: 'bodySm' as const },
  md: { py: sp(10), px: sp(12), textVariant: 'body' as const },
  lg: { py: sp(12), px: sp(14), textVariant: 'bodyLg' as const },
};

export const resolveButtonVariant = resolveVariant;

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  leftIcon,
  style,
  android_ripple,
  ...rest
}) => {
  const colors = useThemeStore((s) => s.colors);
  const variantStyle = useMemo(() => resolveButtonVariant(variant, colors), [variant, colors]);
  const sizeStyle = sizeMap[size];

  return (
    <Pressable
      accessibilityRole='button'
      android_ripple={android_ripple ?? { color: colors.ripple }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          paddingVertical: sizeStyle.py,
          paddingHorizontal: sizeStyle.px,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text variant={sizeStyle.textVariant} weight='bold' style={{ color: variantStyle.textColor }}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: rd('lg'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;

