import React from 'react';
import { TextInputProps, StyleSheet } from 'react-native';
import TextInput from './TextInput';
import useThemeStore from '@/context/Theme-store';

interface Props extends TextInputProps {
  unstyled?: boolean;
}

const useStyles = (c: ReturnType<typeof useThemeStore>['colors']) =>
StyleSheet.create({
  memoInput: {
    backgroundColor: c.inputBackground,
    color: c.text,
    padding: 10,
    borderRadius: 5,
    height: 150,
    textAlignVertical: 'top',
  },
});

const MultiTextInput: React.FC<Props> = ({ style, numberOfLines = 2, unstyled = false, ...rest }) => {
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const inputStyle = unstyled ? style : [styles.memoInput, style];
  return (
    <TextInput
      unstyled
      style={inputStyle}
      multiline
      numberOfLines={numberOfLines}
      returnKeyType='default'
      textAlignVertical='top'
      enablesReturnKeyAutomatically={false}
      {...rest}
    />
  );
};

export default MultiTextInput;
