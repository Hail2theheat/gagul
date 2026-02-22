/**
 * FiresideReactions - Floating emoji reactions + inline comment bubbles for Fireside
 * Emojis float up like TikTok live reactions when tapped.
 * Comments float up as semi-transparent bubbles over the content.
 * Existing reactions/comments replay as a staggered burst on load.
 * Real-time reactions/comments from others appear as they happen.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getUserEmojis,
  DEFAULT_EMOJIS,
  UserEmojis,
  getResponseReactions,
  addReaction,
  subscribeToReactions,
  ReactionSummary,
} from '../../lib/services/reactionService';
import {
  getComments,
  subscribeToComments,
  FiresideComment,
} from '../../lib/services/firesideService';
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

interface FloatingComment {
  id: string;
  text: string;
  username: string;
  startX: number;
  anim: Animated.Value;
  duration: number;
}

interface FiresideReactionsProps {
  responseId: string;
  promptId?: string;
  onCommentSubmit?: (content: string) => Promise<void>;
}

export function FiresideReactions({ responseId, promptId, onCommentSubmit }: FiresideReactionsProps) {
  const [userEmojis, setUserEmojis] = useState<UserEmojis>(DEFAULT_EMOJIS);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [floatingComments, setFloatingComments] = useState<FloatingComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const commentIdCounter = useRef(0);
  const emojiIdCounter = useRef(0);
  const prevReactionsRef = useRef<ReactionSummary[]>([]);
  const hasLoadedRef = useRef(false);
  const hasLoadedCommentsRef = useRef(false);
  const loadedCommentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadEmojis();
  }, []);

  // Load existing reactions and subscribe to real-time changes
  useEffect(() => {
    hasLoadedRef.current = false;
    prevReactionsRef.current = [];

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

  // Load existing comments and subscribe to real-time comments
  useEffect(() => {
    hasLoadedCommentsRef.current = false;
    loadedCommentIdsRef.current = new Set();

    const loadExistingComments = async () => {
      const existingComments = await getComments(responseId);
      hasLoadedCommentsRef.current = true;

      // Track all existing comment IDs
      for (const c of existingComments) {
        loadedCommentIdsRef.current.add(c.id);
      }

      // Replay existing comments as staggered floating bubbles
      const maxDelay = Math.min(existingComments.length * 300, 3000);
      existingComments.forEach((comment, i) => {
        const delay = (i / Math.max(existingComments.length - 1, 1)) * maxDelay;
        setTimeout(() => {
          spawnFloatingComment(comment.content, comment.username || 'Anon');
        }, delay);
      });
    };

    loadExistingComments();

    // Subscribe to new real-time comments
    const unsubscribe = subscribeToComments(responseId, (newComment) => {
      if (!hasLoadedCommentsRef.current) return;
      // Skip if we already spawned this comment (from our own submission or initial load)
      if (loadedCommentIdsRef.current.has(newComment.id)) return;
      loadedCommentIdsRef.current.add(newComment.id);
      spawnFloatingComment(newComment.content, newComment.username || 'Anon');
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

  const spawnFloatingComment = useCallback((text: string, username: string) => {
    const id = `comment-${Date.now()}-${commentIdCounter.current++}`;
    const anim = new Animated.Value(0);
    const startX = SCREEN_WIDTH * 0.05 + Math.random() * SCREEN_WIDTH * 0.4;
    const duration = 6000 + Math.min(text.length * 60, 8000);

    const newComment: FloatingComment = {
      id,
      text,
      username,
      startX,
      anim,
      duration,
    };

    setFloatingComments(prev => [...prev, newComment]);

    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setFloatingComments(prev => prev.filter(c => c.id !== id));
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

    // Pre-increment prevReactionsRef so real-time subscription doesn't spawn a duplicate
    const prev = prevReactionsRef.current;
    const existing = prev.find(r => r.emoji === emoji);
    if (existing) {
      existing.count += 1;
    } else {
      prev.push({ emoji, count: 1, users: [] });
    }

    // Persist every tap (increments tap_count in DB)
    addReaction(responseId, emoji);

    // Track every tap for engagement metrics
    trackInteraction('emoji_reaction', {
      responseId,
      metadata: { emoji, promptId },
    });
  };

  const handleCommentSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !onCommentSubmit) return;

    setCommentText('');

    // Spawn floating bubble immediately for responsiveness
    spawnFloatingComment(trimmed, 'You');

    // Persist
    await onCommentSubmit(trimmed);
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

        {/* Floating comments layer */}
        {floatingComments.map(fc => (
          <Animated.View
            key={fc.id}
            style={[
              styles.floatingCommentBubble,
              {
                left: fc.startX,
                opacity: fc.anim.interpolate({
                  inputRange: [0, 0.1, 0.85, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: fc.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -SCREEN_HEIGHT * 0.6],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.floatingCommentUsername}>{fc.username}</Text>
            <Text style={styles.floatingCommentText}>{fc.text}</Text>
          </Animated.View>
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

      {/* Comment input bar */}
      {onCommentSubmit && (
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleCommentSubmit}
            returnKeyType="send"
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.commentSendButton, !commentText.trim() && { opacity: 0.4 }]}
            onPress={handleCommentSubmit}
            disabled={!commentText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color="#FFF8DC" />
          </TouchableOpacity>
        </View>
      )}
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
  floatingCommentBubble: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
  },
  floatingCommentUsername: {
    color: '#FFD93D',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Paaxel',
    marginBottom: 2,
  },
  floatingCommentText: {
    color: '#F5F5F5',
    fontSize: 13,
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
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 19,
    paddingHorizontal: 14,
    color: '#F5F5F5',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  commentSendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 107, 53, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
