/**
 * StepsPhotoInput - Photo picker + numeric step count input
 * Used for "Steps Challenge" prompts where user submits a Health app screenshot
 * and enters their daily step average as a number
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CampfireColors } from '../../constants/theme';
import { PhotoPicker } from './PhotoPicker';

interface StepsPhotoInputProps {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  stepCount: string;
  onStepCountChange: (count: string) => void;
  disabled?: boolean;
}

export function StepsPhotoInput({
  photoUri,
  onPhotoChange,
  stepCount,
  onStepCountChange,
  disabled = false,
}: StepsPhotoInputProps) {
  const handleStepCountChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    // Limit to 100000
    if (cleaned && parseInt(cleaned, 10) > 100000) return;
    onStepCountChange(cleaned);
  };

  const isValidCount = stepCount.trim() !== '' && /^\d+$/.test(stepCount.trim());

  return (
    <View style={styles.container}>
      <PhotoPicker
        value={photoUri}
        onChange={onPhotoChange}
        disabled={disabled}
      />

      <View style={styles.stepSection}>
        <Text style={styles.label}>Your daily step average</Text>
        <TextInput
          style={[
            styles.input,
            disabled && styles.inputDisabled,
            isValidCount && styles.inputValid,
          ]}
          value={stepCount}
          onChangeText={handleStepCountChange}
          keyboardType="numeric"
          placeholder="e.g. 8500"
          placeholderTextColor={CampfireColors.MUTED + '80'}
          maxLength={6}
          editable={!disabled}
        />
        {stepCount.trim() !== '' && !isValidCount && (
          <Text style={styles.errorText}>Enter a valid number</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  stepSection: {
    gap: 6,
  },
  label: {
    color: CampfireColors.TEXT,
    fontSize: 14,
    fontFamily: 'Paaxel',
  },
  input: {
    backgroundColor: CampfireColors.INPUT_BG,
    borderWidth: 1,
    borderColor: CampfireColors.BORDER,
    borderRadius: 12,
    padding: 14,
    color: CampfireColors.TEXT,
    fontSize: 22,
    fontFamily: 'Paaxel',
    textAlign: 'center',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputValid: {
    borderColor: CampfireColors.SUCCESS + '60',
  },
  errorText: {
    color: CampfireColors.DANGER,
    fontSize: 12,
    fontFamily: 'Paaxel',
  },
});

export default StepsPhotoInput;
