/**
 * useKeyboardScroll - Scrolls a ScrollView to keep focused TextInput visible
 * and provides keyboard height for rendering a floating dismiss button.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, findNodeHandle } from 'react-native';

export function useKeyboardScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);

      // Scroll to make focused input visible
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    scrollRef,
    keyboardHeight,
    keyboardVisible,
    dismissKeyboard,
  };
}
