/**
 * FiresideReactions - Floating emoji reactions for Fireside
 * Emojis float up like burning ash when tapped
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
} from '../../lib/services/reactionService';
import { trackInteraction } from '../../lib/services/metricsService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  useEffect(() => {
    loadEmojis();
  }, []);

  const loadEmojis = async () => {
    const emojis = await getUserEmojis();
    setUserEmojis(emojis);
  };

  const spawnFloatingEmoji = useCallback((emoji: string, buttonX: number) => {
    const id = `${Date.now()}-${emojiIdCounter.current++}`;
    const anim = new Animated.Value(0);
    const drift = (Math.random() - 0.5) * 80; // Random horizontal drift
    const rotation = (Math.random() - 0.5) * 60; // Random rotation -30 to 30 degrees
    const scale = 0.8 + Math.random() * 0.4; // Random scale 0.8 to 1.2

    const newEmoji: FloatingEmoji = {
      id,
      emoji,
      startX: buttonX + (Math.random() - 0.5) * 20,
      anim,
      drift,
      rotation,
      scale,
    };

    setFloatingEmojis(prev => [...prev, newEmoji]);

    // Animate the emoji floating up
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000 + Math.random() * 1000, // 2-3 seconds
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // Remove emoji after animation
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });

    // Track the interaction
    trackInteraction('emoji_reaction', {
      responseId,
      metadata: { emoji, promptId },
    });
  }, [responseId, promptId]);

  const handleEmojiPress = (emoji: string, index: number) => {
    // Calculate approximate button X position
    const buttonWidth = 52;
    const gap = 8;
    const totalWidth = 4 * buttonWidth + 3 * gap;
    const startX = (Dimensions.get('window').width - totalWidth) / 2;
    const buttonX = startX + index * (buttonWidth + gap) + buttonWidth / 2;

    spawnFloatingEmoji(emoji, buttonX);
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
