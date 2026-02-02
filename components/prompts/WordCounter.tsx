/**
 * WordCounter - displays word count with min/max indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { countWords } from '../../lib/types/prompts';

// Theme colors
const COLORS = {
  text: '#E6F0FF',
  muted: '#9EC5FF',
  success: '#4ADE80',
  warning: '#FFA500',
  error: '#FF4444',
};

interface WordCounterProps {
  text: string;
  min: number;
  max: number;
  showProgress?: boolean;
}

export function WordCounter({ text, min, max, showProgress = true }: WordCounterProps) {
  const count = countWords(text);

  // Determine status
  const getStatus = (): 'under' | 'valid' | 'over' => {
    if (count < min) return 'under';
    if (count > max) return 'over';
    return 'valid';
  };

  const status = getStatus();

  const getColor = () => {
    switch (status) {
      case 'under':
        return COLORS.muted;
      case 'valid':
        return COLORS.success;
      case 'over':
        return COLORS.error;
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'under':
        return `${min - count} more word${min - count === 1 ? '' : 's'} needed`;
      case 'valid':
        return '✓';
      case 'over':
        return `${count - max} word${count - max === 1 ? '' : 's'} over limit`;
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
                { left: `${(min / max) * 100}%` },
              ]}
            />
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
    backgroundColor: '#1E3A5F',
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
    backgroundColor: '#9EC5FF',
    opacity: 0.5,
  },
});

export default WordCounter;
