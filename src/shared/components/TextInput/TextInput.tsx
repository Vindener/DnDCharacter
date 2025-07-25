import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import useThemeStore from '@/context/Theme-store';

interface Props extends TextInputProps {
  unstyled?: boolean;
}

const useStyles = (c: ReturnType<typeof useThemeStore>['colors']) =>
StyleSheet.create({
  input: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
});

const TextInput: React.FC<Props> = ({ style, unstyled = false, ...rest }) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const inputStyle = unstyled ? style : [styles.input, style];
  return <RNTextInput style={inputStyle} placeholderTextColor={colors.textSecondary} {...rest} />;
};

export default TextInput;
