import React from 'react';
import { TextInputProps, StyleSheet } from 'react-native';
import TextInput from './TextInput';

interface Props extends TextInputProps {
  unstyled?: boolean;
}

const styles = StyleSheet.create({
  memoInput: {
    backgroundColor: '#555',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    height: 150,
    textAlignVertical: 'top',
  },
});

const MultiTextInput: React.FC<Props> = ({ style, numberOfLines = 2, unstyled = false, ...rest }) => {
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
