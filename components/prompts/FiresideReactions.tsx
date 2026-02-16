/**
 * FiresideReactions - Floating emoji reactions for Fireside
 * Emojis float up like TikTok live reactions when tapped.
 * Existing reactions from other users replay as a staggered burst on load.
 * Real-time reactions from others appear as they happen.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {
  getUserEmojis,
  DEFAULT_EMOJIS,
  UserEmojis,
  getResponseReactions,
  toggleReaction,
  subscribeToReactions,
  ReactionSummary,
} from '../../lib/services/reactionService';
import { trackInteraction } from '../../lib/services/metricsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  bg: 'rgba(0, 0, 0, 0.4)',
  text: '#F5F5F5',
  muted: '#9CA3AF',
};

interface FloatingEmoji {
  id: string;
  emoji: string;
  startX: number;
  anim: Animated.Value;
  drift: number;
  rotation: number;
  scale: number;
}

interface FiresideReactionsProps {
  responseId: string;
  promptId?: string;
}

export function FiresideReactions({ responseId, promptId }: FiresideReactionsProps) {
  const [userEmojis, setUserEmojis] = useState<UserEmojis>(DEFAULT_EMOJIS);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const emojiIdCounter = useRef(0);
  const prevReactionsRef = useRef<ReactionSummary[]>([]);
  const hasLoadedRef = useRef(false);
  const savedEmojiRef = useRef<string | null>(null); // Track which emoji is already persisted

  useEffect(() => {
    loadEmojis();
  }, []);

  // Load existing reactions and subscribe to real-time changes
  useEffect(() => {
    hasLoadedRef.current = false;
    prevReactionsRef.current = [];
    savedEmojiRef.current = null;

    // Fetch existing reactions and replay them as a staggered burst
    const loadExistingReactions = async () => {
      const reactions = await getResponseReactions(responseId);
      prevReactionsRef.current = reactions;
      hasLoadedRef.current = true;

      // Build a flat list of emojis to spawn, one per count
      const emojisToSpawn: string[] = [];
      for (const r of reactions) {
        for (let i = 0; i < r.count; i++) {
          emojisToSpawn.push(r.emoji);
        }
      }

      // Stagger spawn so they don't all pop at once (like balloons rising)
      const maxDelay = Math.min(emojisToSpawn.length * 150, 2000);
      emojisToSpawn.forEach((emoji, i) => {
        const delay = (i / Math.max(emojisToSpawn.length - 1, 1)) * maxDelay;
        setTimeout(() => {
          spawnFloatingEmojiRandom(emoji);
        }, delay);
      });
    };

    loadExistingReactions();

    // Subscribe to real-time reaction changes from others
    const unsubscribe = subscribeToReactions(responseId, (newReactions) => {
      if (!hasLoadedRef.current) return;

      // Compare with previous to find new emojis
      for (const nr of newReactions) {
        const prev = prevReactionsRef.current.find(r => r.emoji === nr.emoji);
        const prevCount = prev ? prev.count : 0;
        const diff = nr.count - prevCount;
        // Spawn floating emojis for each new reaction
        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            setTimeout(() => {
              spawnFloatingEmojiRandom(nr.emoji);
            }, i * 200);
          }
        }
      }
      prevReactionsRef.current = newReactions;
    });

    return () => {
      unsubscribe();
    };
  }, [responseId]);

  const loadEmojis = async () => {
    const emojis = await getUserEmojis();
    setUserEmojis(emojis);
  };

  // Spawn a floating emoji at a random X position (for existing/real-time reactions)
  const spawnFloatingEmojiRandom = useCallback((emoji: string) => {
    const x = SCREEN_WIDTH * 0.15 + Math.random() * SCREEN_WIDTH * 0.7;
    spawnFloatingEmoji(emoji, x);
  }, []);

  const spawnFloatingEmoji = useCallback((emoji: string, startX: number) => {
    const id = `${Date.now()}-${emojiIdCounter.current++}`;
    const anim = new Animated.Value(0);
    const drift = (Math.random() - 0.5) * 80;
    const rotation = (Math.random() - 0.5) * 60;
    const scale = 0.8 + Math.random() * 0.4;

    const newEmoji: FloatingEmoji = {
      id,
      emoji,
      startX: startX + (Math.random() - 0.5) * 20,
      anim,
      drift,
      rotation,
      scale,
    };

    setFloatingEmojis(prev => [...prev, newEmoji]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 2000 + Math.random() * 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
  }, []);

  const handleEmojiPress = (emoji: string, index: number) => {
    // Calculate button X position for the float origin
    const buttonWidth = 52;
    const gap = 8;
    const totalWidth = 4 * buttonWidth + 3 * gap;
    const startX = (SCREEN_WIDTH - totalWidth) / 2;
    const buttonX = startX + index * (buttonWidth + gap) + buttonWidth / 2;

    // Spawn local floating emoji immediately (always - every tap)
    spawnFloatingEmoji(emoji, buttonX);

    // Only persist if this is a new emoji or different from what's saved
    // Avoids toggling off on repeated taps of the same emoji
    if (savedEmojiRef.current !== emoji) {
      savedEmojiRef.current = emoji;
      toggleReaction(responseId, emoji);
    }

    // Track every tap for engagement metrics
    trackInteraction('emoji_reaction', {
      responseId,
      metadata: { emoji, promptId },
    });
  };

  const emojiList = [
    userEmojis.emoji_slot_1,
    userEmojis.emoji_slot_2,
    userEmojis.emoji_slot_3,
    userEmojis.emoji_slot_4,
  ];

  return (
    <View style={styles.container}>
      {/* Floating emojis layer */}
      <View style={styles.floatingLayer} pointerEvents="none">
        {floatingEmojis.map(fe => (
          <Animated.Text
            key={fe.id}
            style={[
              styles.floatingEmoji,
              {
                left: fe.startX,
                opacity: fe.anim.interpolate({
                  inputRange: [0, 0.1, 0.7, 1],
                  outputRange: [0, 1, 0.8, 0],
                }),
                transform: [
                  {
                    translateY: fe.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -SCREEN_HEIGHT * 0.5],
                    }),
                  },
                  {
                    translateX: fe.anim.interpolate({
                      inputRange: [0, 0.3, 0.6, 1],
                      outputRange: [0, fe.drift * 0.3, fe.drift * 0.7, fe.drift],
                    }),
                  },
                  {
                    rotate: fe.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${fe.rotation}deg`],
                    }),
                  },
                  { scale: fe.scale },
                ],
              },
            ]}
          >
            {fe.emoji}
          </Animated.Text>
        ))}
      </View>

      {/* Emoji buttons */}
      <View style={styles.emojiRow}>
        {emojiList.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => handleEmojiPress(emoji, index)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  floatingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    overflow: 'visible',
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 60,
    fontSize: 36,
    textShadowColor: 'rgba(255, 107, 53, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emojiText: {
    fontSize: 28,
  },
});
