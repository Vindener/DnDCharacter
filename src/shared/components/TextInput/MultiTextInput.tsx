import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { AutoGrowingTextInput } from 'react-native-autogrow-textinput';
import useThemeStore from '@/context/Theme-store';

type MultiTextInputProps = {
  containerStyle?: StyleProp<ViewStyle>;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onSizeChange?: (h: number) => void;
} & React.ComponentProps<typeof AutoGrowingTextInput>;

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

  return (
    <View
      style={[
        {
          position: 'relative',
          width: '100%',
          minHeight,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          backgroundColor: colors.inputBackground,
          overflow: 'hidden',
        },
        containerStyle,
      ]}
    >
      <AutoGrowingTextInput
        {...props}
        style={[
          {
            minHeight,
            maxHeight,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
            textAlignVertical: 'top',
          },
          style,
        ]}
        scrollEnabled={true}
        enableScrollToCaret
        underlineColorAndroid='transparent'
        maxHeight={maxHeight}
        defaultHeight={initialHeight}
        onHeightChanged={(h) => {
          if (onSizeChange) onSizeChange(h);
        }}
      />
    </View>
  );
}
