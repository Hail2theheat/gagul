/**
 * PromptRating - 5-face rating after submission
 * 1 = disgusted, 2 = sad, 3 = neutral, 4 = happy, 5 = laughing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { submitRating } from '../../lib/services/promptService';
import { awardPoints } from '../../lib/services/pointsService';
import { CampfireColors } from '../../constants/theme';

// DESIGN.md §19: Never hardcode hex values
const COLORS = {
  bg: CampfireColors.BG,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  selected: CampfireColors.RATING_LOVE, // DESIGN.md §5.8 - Use RATING_* tokens
};

// Face emoji components for each rating
// DESIGN.md §5.8: Rating face colors (prompt feedback)
const FACE_CONFIGS = [
  { rating: 1, label: 'Awful', color: CampfireColors.RATING_HATE },      // Terrible
  { rating: 2, label: 'Meh', color: CampfireColors.RATING_DISLIKE },     // Dislike
  { rating: 3, label: 'Okay', color: CampfireColors.RATING_NEUTRAL },    // Neutral
  { rating: 4, label: 'Good', color: CampfireColors.RATING_LIKE },       // Like
  { rating: 5, label: 'Great!', color: CampfireColors.RATING_LOVE },     // Love
];

// Pixel art face component
function PixelFace({ rating, size = 36, selected = false }: { rating: number; size?: number; selected?: boolean }) {
  const s = size / 36; // Scale factor
  const config = FACE_CONFIGS[rating - 1];

  // Face base color based on rating (DESIGN.md §19: Never hardcode hex values)
  const faceColor = selected ? CampfireColors.RATING_LOVE : CampfireColors.TEXT_CREAM;
  const featureColor = selected ? '#7C2D12' : '#5D4037'; // Feature colors for eyes/mouth (pixel art details)

  return (
    <View style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size / 2,
      backgroundColor: faceColor,
      borderWidth: 2 * s,
      // DESIGN.md §19: Never hardcode hex values - use design tokens
      borderColor: selected ? CampfireColors.RATING_LIKE : CampfireColors.RATING_LOVE_BG,
      shadowColor: selected ? CampfireColors.RATING_LOVE : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: selected ? 0.8 : 0,
      shadowRadius: selected ? 8 : 0,
    }}>
      {/* Eyes */}
      {rating === 1 ? (
        // Disgusted - X eyes
        <>
          <View style={{ position: 'absolute', top: 10 * s, left: 7 * s }}>
            <View style={{ width: 6 * s, height: 2 * s, backgroundColor: featureColor, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
            <View style={{ width: 6 * s, height: 2 * s, backgroundColor: featureColor, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
          </View>
          <View style={{ position: 'absolute', top: 10 * s, right: 7 * s }}>
            <View style={{ width: 6 * s, height: 2 * s, backgroundColor: featureColor, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
            <View style={{ width: 6 * s, height: 2 * s, backgroundColor: featureColor, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
          </View>
        </>
      ) : rating === 2 ? (
        // Sad - droopy eyes
        <>
          <View style={{ position: 'absolute', top: 11 * s, left: 8 * s, width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: featureColor }} />
          <View style={{ position: 'absolute', top: 11 * s, right: 8 * s, width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: featureColor }} />
        </>
      ) : rating === 5 ? (
        // Laughing - closed happy eyes (arcs)
        <>
          <View style={{ position: 'absolute', top: 10 * s, left: 6 * s, width: 8 * s, height: 4 * s, borderTopWidth: 2.5 * s, borderTopColor: featureColor, borderTopLeftRadius: 4 * s, borderTopRightRadius: 4 * s }} />
          <View style={{ position: 'absolute', top: 10 * s, right: 6 * s, width: 8 * s, height: 4 * s, borderTopWidth: 2.5 * s, borderTopColor: featureColor, borderTopLeftRadius: 4 * s, borderTopRightRadius: 4 * s }} />
        </>
      ) : (
        // Neutral & Happy - regular eyes
        <>
          <View style={{ position: 'absolute', top: 11 * s, left: 8 * s, width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: featureColor }} />
          <View style={{ position: 'absolute', top: 11 * s, right: 8 * s, width: 5 * s, height: 5 * s, borderRadius: 2.5 * s, backgroundColor: featureColor }} />
        </>
      )}

      {/* Mouth */}
      {rating === 1 ? (
        // Disgusted - wavy/disgusted mouth
        <View style={{ position: 'absolute', bottom: 8 * s, width: 14 * s, height: 3 * s, backgroundColor: featureColor, borderRadius: 1.5 * s, transform: [{ rotate: '-10deg' }] }} />
      ) : rating === 2 ? (
        // Sad - frown (upside down arc)
        <View style={{ position: 'absolute', bottom: 7 * s, width: 12 * s, height: 6 * s, borderBottomWidth: 2.5 * s, borderBottomColor: featureColor, borderBottomLeftRadius: 6 * s, borderBottomRightRadius: 6 * s }} />
      ) : rating === 3 ? (
        // Neutral - straight line
        <View style={{ position: 'absolute', bottom: 10 * s, width: 12 * s, height: 2.5 * s, backgroundColor: featureColor, borderRadius: 1 * s }} />
      ) : rating === 4 ? (
        // Happy - smile (arc)
        <View style={{ position: 'absolute', bottom: 8 * s, width: 12 * s, height: 6 * s, borderTopWidth: 2.5 * s, borderTopColor: featureColor, borderTopLeftRadius: 6 * s, borderTopRightRadius: 6 * s }} />
      ) : (
        // Laughing - big open mouth
        <View style={{ position: 'absolute', bottom: 5 * s, width: 16 * s, height: 10 * s, backgroundColor: featureColor, borderRadius: 5 * s }}>
          <View style={{ position: 'absolute', top: 2 * s, left: 2 * s, right: 2 * s, height: 3 * s, backgroundColor: '#FF6B6B', borderRadius: 1.5 * s }} />
        </View>
      )}
    </View>
  );
}

interface PromptRatingProps {
  promptId: string;
  hasRated: boolean;
  initialRating?: number | boolean | null;
  onRated?: (rating: number) => void;
}

export function PromptRating({
  promptId,
  hasRated: initialHasRated,
  initialRating,
  onRated,
}: PromptRatingProps) {
  const [hasRated, setHasRated] = useState(initialHasRated);
  const [dismissed, setDismissed] = useState(initialHasRated || initialRating != null);
  // Convert boolean to number if needed (legacy support)
  const convertedInitial = typeof initialRating === 'boolean'
    ? (initialRating ? 5 : 1)
    : (initialRating ?? null);
  const [rating, setRating] = useState<number | null>(convertedInitial);
  const [fadeAnim] = useState(() => new Animated.Value(1));

  // Sync with parent prop - if parent says already rated, skip to dismissed
  useEffect(() => {
    if (initialHasRated && !hasRated) {
      setHasRated(true);
      setDismissed(true);
    }
  }, [initialHasRated]);

  // Auto-dismiss after rating
  useEffect(() => {
    if (hasRated && rating !== null && !dismissed) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
        // Dismiss after fade completes (don't rely on callback)
        setTimeout(() => setDismissed(true), 500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasRated, rating]);

  const handleRate = async (newRating: number) => {
    if (hasRated) return;

    // Optimistic — show "Thanks" immediately, submit in background
    // (rating is low-stakes, don't block the user)
    setHasRated(true);
    setRating(newRating);
    onRated?.(newRating);

    try {
      const result = await submitRating(promptId, newRating);
      if (result.success) {
        awardPoints('rating').catch(() => {});
      }
    } catch (err) {
      console.error('Rating submission error:', err);
    }
  };

  if (dismissed) return null;

  if (hasRated && rating !== null) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.thanksText}>Thanks for rating!</Text>
        <View style={styles.ratedIndicator}>
          <PixelFace rating={rating} size={48} selected />
          <Text style={[styles.ratedLabel, { color: FACE_CONFIGS[rating - 1].color }]}>
            {FACE_CONFIGS[rating - 1].label}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How was this prompt?</Text>
      <View style={styles.facesRow}>
        {FACE_CONFIGS.map((config) => (
          <TouchableOpacity
            key={config.rating}
            style={styles.faceButton}
            onPress={() => handleRate(config.rating)}
          >
            <PixelFace rating={config.rating} size={40} />
            <Text style={[styles.faceLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        ))}
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
  facesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  faceButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  faceLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  thanksText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratedIndicator: {
    alignItems: 'center',
    padding: 8,
  },
  ratedLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
});

export default PromptRating;
