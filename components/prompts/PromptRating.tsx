/**
 * PromptRating - thumbs up/down rating after submission
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitRating } from '../../lib/services/promptService';

// Theme colors
const COLORS = {
  bg: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  thumbsUp: '#4ADE80',
  thumbsDown: '#FF6B6B',
};

interface PromptRatingProps {
  promptId: string;
  hasRated: boolean;
  initialRating?: boolean | null;
  onRated?: (rating: boolean) => void;
}

export function PromptRating({
  promptId,
  hasRated: initialHasRated,
  initialRating,
  onRated,
}: PromptRatingProps) {
  const [hasRated, setHasRated] = useState(initialHasRated);
  const [rating, setRating] = useState<boolean | null>(initialRating ?? null);
  const [loading, setLoading] = useState(false);

  const handleRate = async (newRating: boolean) => {
    if (loading) return;

    setLoading(true);
    const result = await submitRating(promptId, newRating);
    setLoading(false);

    if (result.success) {
      setHasRated(true);
      setRating(newRating);
      onRated?.(newRating);
    }
  };

  if (hasRated) {
    return (
      <View style={styles.container}>
        <Text style={styles.thanksText}>Thanks for rating!</Text>
        <View style={styles.ratedIndicator}>
          {rating === true && (
            <Ionicons name="thumbs-up" size={24} color={COLORS.thumbsUp} />
          )}
          {rating === false && (
            <Ionicons name="thumbs-down" size={24} color={COLORS.thumbsDown} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How was this prompt?</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.rateButton, styles.thumbsUpButton]}
          onPress={() => handleRate(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.thumbsUp} />
          ) : (
            <>
              <Ionicons name="thumbs-up-outline" size={24} color={COLORS.thumbsUp} />
              <Text style={[styles.buttonText, { color: COLORS.thumbsUp }]}>
                Great
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rateButton, styles.thumbsDownButton]}
          onPress={() => handleRate(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.thumbsDown} />
          ) : (
            <>
              <Ionicons name="thumbs-down-outline" size={24} color={COLORS.thumbsDown} />
              <Text style={[styles.buttonText, { color: COLORS.thumbsDown }]}>
                Meh
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 16,
  },
  label: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
  },
  thumbsUpButton: {
    borderColor: COLORS.thumbsUp + '40',
    backgroundColor: COLORS.thumbsUp + '10',
  },
  thumbsDownButton: {
    borderColor: COLORS.thumbsDown + '40',
    backgroundColor: COLORS.thumbsDown + '10',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  thanksText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratedIndicator: {
    padding: 8,
  },
});

export default PromptRating;
