import React from 'react';
import { TextInput as RNTextInput, StyleSheet, type TextInputProps } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { fs, rd, sp } from '@/shared/styles/tokens';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends TextInputProps {
  size?: InputSize;
  invalid?: boolean;
}

const inputSizeMap = {
  sm: { py: sp(6), px: sp(8), fontSize: fs(12) },
  md: { py: sp(8), px: sp(10), fontSize: fs(13) },
  lg: { py: sp(10), px: sp(12), fontSize: fs(14) },
};

export const Input: React.FC<InputProps> = ({ size = 'md', style, invalid = false, ...rest }) => {
  const colors = useThemeStore((s) => s.colors);
  const sized = inputSizeMap[size];

  return (
    <RNTextInput
      style={[
        styles.base,
        {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          borderColor: invalid ? colors.danger : colors.border,
          paddingHorizontal: sized.px,
          paddingVertical: sized.py,
          fontSize: sized.fontSize,
        },
        style,
      ]}
      placeholderTextColor={colors.textSecondary}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: rd('md'),
    borderWidth: 1,
  },
});

export default Input;
