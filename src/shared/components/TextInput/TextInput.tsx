import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import useThemeStore from '@/context/Theme-store';
import { rd } from '@/shared/styles/tokens';
import { Input } from '@/shared/ui';

interface Props extends TextInputProps {
  unstyled?: boolean;
}

type ThemeLike = {
  textSecondary: string;
};

const createStyles = () =>
  StyleSheet.create({
    input: {
      borderRadius: rd(5),
      width: 60,
      textAlign: 'center',
    },
  });

const TextInput: React.FC<Props> = ({ style, unstyled = false, ...rest }) => {
  const colors = useThemeStore((s) => s.colors as ThemeLike);
  const styles = React.useMemo(() => createStyles(), []);

  if (unstyled) {
    return <RNTextInput style={style} placeholderTextColor={colors.textSecondary} {...rest} />;
  }

  return <Input size='sm' style={[styles.input, style]} {...rest} />;
};

export default TextInput;
