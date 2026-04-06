import React, { useState } from 'react';
import { rd, sp } from '@/shared/styles/tokens';
import {
  View,
  StyleProp,
  ViewStyle,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import useThemeStore from '@/context/Theme-store';

type MultiTextInputProps = {
  containerStyle?: StyleProp<ViewStyle>;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onSizeChange?: (h: number) => void;
} & TextInputProps;

export default function MultiTextInput({
  containerStyle,
  style,
  initialHeight = 140,
  minHeight = 80,
  maxHeight = 480,
  onSizeChange,
  ...props
}: MultiTextInputProps) {
  const colors = useThemeStore((s) => s.colors);
  const [height, setHeight] = useState(initialHeight);

  const handleContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const newHeight = Math.min(maxHeight, Math.max(minHeight, e.nativeEvent.contentSize.height));
    setHeight(newHeight);
    if (onSizeChange) onSizeChange(newHeight);
  };

  return (
    <View
      style={[
        {
          position: 'relative',
          width: '100%',
          minHeight,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: rd(10),
          backgroundColor: colors.inputBackground,
          overflow: 'hidden',
        },
        containerStyle,
      ]}
    >
      <TextInput
        {...props}
        multiline
        style={[
          {
            height,
            paddingHorizontal: sp(12),
            paddingVertical: sp(10),
            color: colors.text,
            textAlignVertical: 'top',
          },
          style,
        ]}
        onContentSizeChange={handleContentSizeChange}
      />
    </View>
  );
}



