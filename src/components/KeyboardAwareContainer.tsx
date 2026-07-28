import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

export interface KeyboardAwareContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  dismissOnClickOutside?: boolean;
  testID?: string;
}

/**
 * KeyboardAwareContainer
 * 
 * Reusable system-wide wrapper component that resolves keyboard overlapping
 * across screens and modals in both iOS and Android.
 */
export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0,
  dismissOnClickOutside = true,
  testID = 'keyboard-aware-container',
}) => {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  const wrappedContent = dismissOnClickOutside ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} testID="keyboard-dismiss-touchable">
      {content}
    </TouchableWithoutFeedback>
  ) : (
    content
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      testID={testID}
    >
      {wrappedContent}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardAwareContainer;
