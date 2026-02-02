/**
 * MajorityGuess - Two-step prompt where users:
 * 1. Answer a multiple choice question
 * 2. Guess what they think the majority will answer
 *
 * Used for "Guess the Group" style prompts
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme colors
const COLORS = {
  bg: '#0D1426',
  card: '#1A2744',
  border: '#27406B',
  borderSelected: '#1E4ED8',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  accent: '#1E4ED8',
  success: '#4ADE80',
  warning: '#FBBF24',
};

interface MajorityGuessProps {
  options: string[];
  onSubmit: (answer: string, guess: string) => void;
  disabled?: boolean;
  promptText?: string;
}

type Step = 'answer' | 'guess';

export function MajorityGuess({
  options,
  onSubmit,
  disabled = false,
  promptText,
}: MajorityGuessProps) {
  const [step, setStep] = useState<Step>('answer');
  const [answer, setAnswer] = useState<string | null>(null);
  const [guess, setGuess] = useState<string | null>(null);

  const handleOptionPress = (option: string) => {
    if (disabled) return;

    if (step === 'answer') {
      setAnswer(option);
    } else {
      setGuess(option);
    }
  };

  const handleNext = () => {
    if (step === 'answer' && answer) {
      setStep('guess');
    } else if (step === 'guess' && guess && answer) {
      onSubmit(answer, guess);
    }
  };

  const handleBack = () => {
    if (step === 'guess') {
      setStep('answer');
      setGuess(null);
    }
  };

  const currentValue = step === 'answer' ? answer : guess;

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step === 'answer' && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'guess' && styles.stepDotActive]} />
      </View>

      {/* Step label */}
      <Text style={styles.stepLabel}>
        {step === 'answer' ? (
          <>
            <Text style={styles.stepNumber}>Step 1: </Text>
            What's YOUR answer?
          </>
        ) : (
          <>
            <Text style={styles.stepNumber}>Step 2: </Text>
            What will MOST people answer?
          </>
        )}
      </Text>

      {step === 'guess' && (
        <Text style={styles.guessHint}>
          Guess correctly to earn bonus points!
        </Text>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = currentValue === option;
          const isYourAnswer = step === 'guess' && option === answer;

          return (
            <TouchableOpacity
              key={`${option}-${index}`}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                disabled && styles.disabled,
              ]}
              onPress={() => handleOptionPress(option)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
              {isYourAnswer && (
                <View style={styles.yourAnswerBadge}>
                  <Text style={styles.yourAnswerText}>Your answer</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttonRow}>
        {step === 'guess' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={18} color={COLORS.muted} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !currentValue && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!currentValue || disabled}
        >
          <Text style={styles.nextButtonText}>
            {step === 'answer' ? 'Next' : 'Submit'}
          </Text>
          <Ionicons
            name={step === 'answer' ? 'arrow-forward' : 'checkmark'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  stepLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  guessHint: {
    color: COLORS.warning,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.borderSelected,
  },
  disabled: {
    opacity: 0.5,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.borderSelected,
    borderColor: COLORS.borderSelected,
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  yourAnswerBadge: {
    backgroundColor: COLORS.success + '30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yourAnswerText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MajorityGuess;
