/**
 * WordCounter - displays word count with min/max indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { countWords } from '../../lib/types/prompts';
import { CampfireColors } from '../../constants/theme';

// Theme colors
const COLORS = {
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  success: CampfireColors.SUCCESS,
  warning: '#FFA500',
  error: CampfireColors.DANGER,
};

interface WordCounterProps {
  text: string;
  min: number;
  max: number;
  good?: number;
  excellent?: number;
  showProgress?: boolean;
}

export function WordCounter({ text, min, max, good, excellent, showProgress = true }: WordCounterProps) {
  const count = countWords(text);

  // Determine status with tiers
  const getStatus = (): 'under' | 'minimal' | 'good' | 'excellent' | 'over' => {
    if (count < min) return 'under';
    if (count > max) return 'over';
    if (excellent && count >= excellent) return 'excellent';
    if (good && count >= good) return 'good';
    return 'minimal';
  };

  const status = getStatus();

  const getColor = () => {
    switch (status) {
      case 'under':
        return COLORS.muted;
      case 'minimal':
        return COLORS.warning;
      case 'good':
        return COLORS.success;
      case 'excellent':
        return '#FFD700'; // Gold
      case 'over':
        return COLORS.error;
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'under':
        return `${min - count} more to submit`;
      case 'minimal':
        return good ? `${good - count} more for bonus points` : '✓';
      case 'good':
        return excellent ? `Good! ${excellent - count} more for excellent` : '✓ Good!';
      case 'excellent':
        return '🌟 Excellent!';
      case 'over':
        return `${count - max} over limit`;
    }
  };

  // Progress bar percentage (0-100)
  const progress = Math.min(100, Math.max(0, (count / max) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <Text style={[styles.count, { color: getColor() }]}>
          {count}/{max}
        </Text>
        <Text style={[styles.message, { color: getColor() }]}>
          {getMessage()}
        </Text>
      </View>

      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getColor(),
                },
              ]}
            />
            {/* Min marker */}
            <View
              style={[
                styles.marker,
                { left: `${(min / max) * 100}%`, backgroundColor: COLORS.muted },
              ]}
            />
            {/* Good marker */}
            {good && (
              <View
                style={[
                  styles.marker,
                  { left: `${(good / max) * 100}%`, backgroundColor: COLORS.success },
                ]}
              />
            )}
            {/* Excellent marker */}
            {excellent && (
              <View
                style={[
                  styles.marker,
                  { left: `${(excellent / max) * 100}%`, backgroundColor: '#FFD700' },
                ]}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: CampfireColors.BORDER,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 8,
    backgroundColor: CampfireColors.MUTED,
    opacity: 0.5,
  },
});

export default WordCounter;
