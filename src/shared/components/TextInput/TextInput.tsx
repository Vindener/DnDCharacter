import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';

interface Props extends TextInputProps {
  unstyled?: boolean;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#555',
    color: 'white',
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
});

const TextInput: React.FC<Props> = ({ style, unstyled = false, ...rest }) => {
  const inputStyle = unstyled ? style : [styles.input, style];
  return <RNTextInput style={inputStyle} placeholderTextColor='#888' {...rest} />;
};

export default TextInput;
