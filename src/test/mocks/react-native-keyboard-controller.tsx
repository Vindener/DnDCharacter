import React, { forwardRef, useImperativeHandle } from 'react';

type MockProps = React.PropsWithChildren<Record<string, unknown>>;

export const KeyboardProvider = ({ children }: MockProps) => React.createElement(React.Fragment, null, children);

export const KeyboardAwareScrollView = forwardRef<{ scrollTo: (options?: unknown) => void }, MockProps>(({ children, ...props }, ref) => {
  useImperativeHandle(ref, () => ({ scrollTo: () => {} }));
  return React.createElement('KeyboardAwareScrollView', props, children as React.ReactNode);
});

export const KeyboardAvoidingView = ({ children, ...props }: MockProps) =>
  React.createElement('KeyboardAvoidingView', props, children as React.ReactNode);

export const KeyboardStickyView = ({ children, ...props }: MockProps) =>
  React.createElement('KeyboardStickyView', props, children as React.ReactNode);

export const KeyboardController = {
  dismiss: () => Promise.resolve(),
  isVisible: () => false,
};
