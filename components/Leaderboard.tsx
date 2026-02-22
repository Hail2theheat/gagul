/**
 * Leaderboard - Ranked list with pixel character avatars and animated points bars
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useLeaderboard } from '../lib/hooks/useLeaderboard';
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from './PixelCharacter';
import { CampfireColors, Typography, Spacing, Radii } from '../constants/theme';
import { Stagger } from '../constants/animations';

const { TEXT_WARM, MUTED, CARD_SOLID: CARD, BORDER, MEDAL_GOLD, MEDAL_SILVER, MEDAL_BRONZE } = CampfireColors;

// Medal colors for top 3 (DESIGN.md §5: use tokens, not hardcoded values)
const MEDAL_COLORS = [MEDAL_GOLD, MEDAL_SILVER, MEDAL_BRONZE]; // Gold, Silver, Bronze
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

function PointsBar({ points, maxPoints, delay }: { points: number; maxPoints: number; delay: number }) {
  const width = useSharedValue(0);
  const targetWidth = maxPoints > 0 ? Math.max((points / maxPoints) * 100, 8) : 8;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      width.value = withTiming(targetWidth, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [targetWidth, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, barStyle]} />
    </View>
  );
}

interface LeaderboardProps {
  limit?: number;
  currentUserId?: string;
}

export function Leaderboard({ limit = 10, currentUserId }: LeaderboardProps) {
  const { data: entries, isLoading, error } = useLeaderboard(limit);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={MUTED} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error || !entries || entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No leaderboard data yet</Text>
      </View>
    );
  }

  const maxPoints = entries[0]?.total_points || 1;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, Typography.heading2]}>Leaderboard</Text>

      {entries.map((entry, index) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const isTopThree = index < 3;

        return (
          <Animated.View
            key={entry.user_id}
            entering={FadeInDown.delay(index * Stagger.LIST_ITEM).duration(350)}
            style={[
              styles.row,
              isCurrentUser && styles.rowHighlighted,
              isTopThree && styles.rowTopThree,
            ]}
          >
            {/* Rank */}
            <View style={[
              styles.rankBadge,
              isTopThree && { backgroundColor: MEDAL_COLORS[index] + '25' },
            ]}>
              <Text style={[
                styles.rankText,
                isTopThree && { color: MEDAL_COLORS[index] },
              ]}>
                {isTopThree ? MEDAL_LABELS[index] : `#${entry.rank}`}
              </Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatar}>
              <PixelCharacter
                config={(entry.avatar_config as CharacterConfig) || DEFAULT_CHARACTER}
                size={28}
              />
            </View>

            {/* Name + Points bar */}
            <View style={styles.info}>
              <Text style={[styles.name, isCurrentUser && styles.nameHighlighted]} numberOfLines={1}>
                {entry.display_name}
                {isCurrentUser ? ' (you)' : ''}
              </Text>
              <PointsBar
                points={entry.total_points}
                maxPoints={maxPoints}
                delay={index * Stagger.LIST_ITEM + 200}
              />
            </View>

            {/* Points */}
            <Text style={[styles.points, isTopThree && { color: MEDAL_COLORS[index] }]}>
              {entry.total_points}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    color: TEXT_WARM,
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  rowHighlighted: {
    borderColor: CampfireColors.WARNING,
    borderWidth: 2,
  },
  rowTopThree: {
    borderColor: BORDER,
  },
  rankBadge: {
    width: 36,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
  },
  rankText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: CampfireColors.TEXT_CREAM,
    fontSize: 14,
    fontWeight: '600',
  },
  nameHighlighted: {
    color: CampfireColors.WARNING,
  },
  barTrack: {
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: CampfireColors.BTN_PRIMARY,
    borderRadius: 2,
  },
  points: {
    color: TEXT_WARM,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default Leaderboard;
