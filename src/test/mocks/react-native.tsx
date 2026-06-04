import React from 'react';

type MockProps = {
  children?: React.ReactNode;
  testID?: string;
  style?: unknown;
  [key: string]: unknown;
};

function createHost(name: string) {
  return function HostComponent({ children, ...props }: MockProps) {
    return React.createElement(name, props, children);
  };
}

class AnimatedValue {
  value: number;

  constructor(value: number) {
    this.value = value;
  }

  setValue(value: number) {
    this.value = value;
  }

  interpolate() {
    return this;
  }
}

function createAnimation() {
  return {
    start: (callback?: () => void) => {
      callback?.();
    },
    stop: () => {},
  };
}

export const View = createHost('View');
export const Text = createHost('Text');
export const ScrollView = createHost('ScrollView');
export const TextInput = createHost('TextInput');
export const Pressable = createHost('Pressable');
export const TouchableOpacity = createHost('TouchableOpacity');
export const Modal = createHost('Modal');
export const Image = createHost('Image');

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
};

export const Animated = {
  Value: AnimatedValue,
  View,
  timing: () => createAnimation(),
  sequence: () => createAnimation(),
  loop: () => createAnimation(),
};

export const Easing = {
  linear: (value: number) => value,
};

export const Platform = {
  OS: 'android',
  select: <T,>(options: { android?: T; ios?: T; default?: T }) => options.android ?? options.default,
};
