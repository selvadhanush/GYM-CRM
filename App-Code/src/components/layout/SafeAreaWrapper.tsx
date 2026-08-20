import React from 'react';
import { ViewStyle } from 'react-native';
import { ScreenContainer } from './ScreenContainer';

// Thin alias over `ScreenContainer` — kept for backwards-compat with existing
// imports. Both wrappers used to duplicate the same insets/StatusBar/loading
// logic independently (a maintenance smell where fixing a bug in one didn't
// fix it in the other); `ScreenContainer` is now the single implementation.
interface SafeAreaWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = (props) => {
  return <ScreenContainer {...props} />;
};
