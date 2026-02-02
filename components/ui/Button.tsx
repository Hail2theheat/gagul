/**
 * Reusable Button component
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

const COLORS = {
  bg: '#1E4ED8',
  text: '#E6F0FF',
  border: '#27406B',
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'solid',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isSolid = variant === 'solid';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        isSolid ? styles.solid : styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.text} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: COLORS.bg,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default Button;
