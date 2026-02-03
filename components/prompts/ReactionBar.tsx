/**
 * ReactionBar - Emoji reactions for Fireside responses
 * Shows reaction counts and allows users to react
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import {
  getResponseReactions,
  toggleReaction,
  getUserReaction,
  getUserEmojis,
  subscribeToReactions,
  ReactionSummary,
  UserEmojis,
  DEFAULT_EMOJIS,
} from '../../lib/services/reactionService';
import { trackInteraction } from '../../lib/services/metricsService';

const COLORS = {
  bg: '#0A0A0F',
  card: '#1A1A2E',
  border: '#2D2D44',
  text: '#F5F5F5',
  muted: '#9CA3AF',
  accent: '#FF6B35',
};

interface ReactionBarProps {
  responseId: string;
  compact?: boolean; // Show smaller version
  onReact?: () => void;
}

export function ReactionBar({ responseId, compact = false, onReact }: ReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);
  const [userEmojis, setUserEmojis] = useState<UserEmojis>(DEFAULT_EMOJIS);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToReactions(responseId, setReactions);
    return unsubscribe;
  }, [responseId]);

  const loadData = async () => {
    const [reactionsData, emojis, currentReaction] = await Promise.all([
      getResponseReactions(responseId),
      getUserEmojis(),
      getUserReaction(responseId),
    ]);
    setReactions(reactionsData);
    setUserEmojis(emojis);
    setUserReaction(currentReaction);
  };

  const handleReaction = async (emoji: string) => {
    if (loading) return;
    setLoading(true);

    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const result = await toggleReaction(responseId, emoji);

    if (result.action === 'added') {
      setUserReaction(emoji);
      trackInteraction('reaction', { responseId, metadata: { emoji } });
    } else {
      setUserReaction(null);
    }

    setShowPicker(false);
    setLoading(false);
    onReact?.();
  };

  const emojiList = [
    userEmojis.emoji_slot_1,
    userEmojis.emoji_slot_2,
    userEmojis.emoji_slot_3,
    userEmojis.emoji_slot_4,
  ];

  // Get total reaction count
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  if (compact) {
    // Compact mode - just show counts
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setShowPicker(true)}
      >
        {reactions.length > 0 ? (
          <View style={styles.compactReactions}>
            {reactions.slice(0, 3).map((r, i) => (
              <Text key={i} style={styles.compactEmoji}>{r.emoji}</Text>
            ))}
            <Text style={styles.compactCount}>{totalReactions}</Text>
          </View>
        ) : (
          <Text style={styles.addReaction}>+</Text>
        )}

        {showPicker && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerPopup}>
              {emojiList.map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.pickerEmoji,
                    userReaction === emoji && styles.pickerEmojiActive,
                  ]}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.pickerEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Full mode - show all emojis with counts
  return (
    <View style={styles.container}>
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <View style={styles.existingReactions}>
          {reactions.map((reaction, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.reactionBubble,
                userReaction === reaction.emoji && styles.reactionBubbleActive,
              ]}
              onPress={() => handleReaction(reaction.emoji)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add reaction button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Emoji picker */}
      {showPicker && (
        <Animated.View style={[styles.picker, { transform: [{ scale: scaleAnim }] }]}>
          {emojiList.map((emoji, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.pickerEmoji,
                userReaction === emoji && styles.pickerEmojiActive,
              ]}
              onPress={() => handleReaction(emoji)}
              disabled={loading}
            >
              <Text style={styles.pickerEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  existingReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  reactionBubbleActive: {
    backgroundColor: COLORS.accent + '30',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 18,
    color: COLORS.muted,
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmojiActive: {
    backgroundColor: COLORS.accent + '30',
  },
  pickerEmojiText: {
    fontSize: 24,
  },
  // Compact styles
  compactContainer: {
    position: 'relative',
  },
  compactReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  compactEmoji: {
    fontSize: 14,
  },
  compactCount: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 4,
  },
  addReaction: {
    fontSize: 18,
    color: COLORS.muted,
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 8,
    zIndex: 100,
  },
  pickerPopup: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
