/**
 * MultipleChoiceResults - displays voting results for MC prompts during Lowdown
 * Supports regular MC, Most Likely To, and Quiz types
 * Shows character avatars for each voter
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from '../PixelCharacter';
import { CampfireColors } from '../../constants/theme';
import type { MCResults, MCResultOption, FiresideResponse } from '../../lib/services/firesideService';

// DESIGN.md §19: Never hardcode hex values - use design tokens
const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: CampfireColors.BTN_PRIMARY,
  success: CampfireColors.SUCCESS,
  warning: CampfireColors.WARNING, // DESIGN.md §5.4 - Use WARNING token
  gold: CampfireColors.MEDAL_GOLD, // DESIGN.md §5.8 - Medals & achievements
};

// Voter info for showing avatars
interface VoterInfo {
  user_id: string;
  username?: string;
  avatar_config?: Record<string, unknown> | null;
  selected_option: string;
}

interface MultipleChoiceResultsProps {
  results: MCResults;
  showCorrectAnswer?: boolean; // For quiz reveal
  voters?: VoterInfo[]; // Optional list of voters with their avatars
}

export function MultipleChoiceResults({ results, showCorrectAnswer = true, voters = [] }: MultipleChoiceResultsProps) {
  if (!results || !results.results || results.results.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noResults}>No responses yet</Text>
      </View>
    );
  }

  const isMostLikely = results.is_most_likely;
  const isQuiz = results.prompt_type === 'quiz';
  const hasCorrectAnswer = isQuiz && results.correct_answer;

  // Group voters by their selected option
  const votersByOption: Record<string, VoterInfo[]> = {};
  voters.forEach(voter => {
    if (voter.selected_option) {
      if (!votersByOption[voter.selected_option]) {
        votersByOption[voter.selected_option] = [];
      }
      votersByOption[voter.selected_option].push(voter);
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isMostLikely ? 'Who Got The Most Votes?' : 'Results'}
        </Text>
        <Text style={styles.totalVotes}>
          {results.total_responses} {results.total_responses === 1 ? 'vote' : 'votes'}
        </Text>
      </View>

      {/* Results bars */}
      <View style={styles.resultsContainer}>
        {results.results.map((option, index) => (
          <ResultBar
            key={option.option || index}
            option={option}
            isMostLikely={isMostLikely}
            isWinner={option.option === results.majority_option}
            isCorrect={hasCorrectAnswer ? option.option === results.correct_answer : false}
            showCorrect={showCorrectAnswer && !!hasCorrectAnswer}
            rank={index + 1}
            voters={votersByOption[option.option] || []}
          />
        ))}
      </View>

      {/* Quiz answer reveal */}
      {isQuiz && showCorrectAnswer && results.correct_answer && (
        <View style={styles.correctAnswerBox}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
          <Text style={styles.correctAnswerText}>{results.correct_answer}</Text>
        </View>
      )}
    </View>
  );
}

interface ResultBarProps {
  option: MCResultOption;
  isMostLikely: boolean;
  isWinner: boolean;
  isCorrect: boolean;
  showCorrect: boolean;
  rank: number;
  voters: VoterInfo[];
}

function ResultBar({ option, isMostLikely, isWinner, isCorrect, showCorrect, rank, voters }: ResultBarProps) {
  const percentage = option.percentage || 0;

  return (
    <View style={[styles.resultBar, isWinner && styles.resultBarWinner]}>
      {/* Left side - avatar(s) */}
      <View style={styles.resultLeft}>
        {isMostLikely && option.avatar_config ? (
          <View style={styles.avatarContainer}>
            <PixelCharacter
              config={(option.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
              size={28}
            />
          </View>
        ) : voters.length > 0 ? (
          // Show voter avatars stacked
          <View style={styles.voterAvatarsContainer}>
            {voters.slice(0, 4).map((voter, idx) => (
              <View
                key={voter.user_id}
                style={[
                  styles.voterAvatarWrapper,
                  { marginLeft: idx > 0 ? -8 : 0, zIndex: 10 - idx },
                ]}
              >
                <PixelCharacter
                  config={(voter.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                  size={22}
                />
              </View>
            ))}
            {voters.length > 4 && (
              <View style={[styles.moreVotersBadge, { marginLeft: -6 }]}>
                <Text style={styles.moreVotersText}>+{voters.length - 4}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.rankBadge, isWinner && styles.rankBadgeWinner]}>
            {isWinner ? (
              <Ionicons name="trophy" size={14} color={COLORS.gold} />
            ) : (
              <Text style={styles.rankText}>{rank}</Text>
            )}
          </View>
        )}
      </View>

      {/* Middle - label and bar */}
      <View style={styles.resultMiddle}>
        <View style={styles.labelRow}>
          <Text style={[styles.optionLabel, isWinner && styles.optionLabelWinner]} numberOfLines={1}>
            {isMostLikely ? option.username || 'Unknown' : option.option}
          </Text>
          {showCorrect && isCorrect && (
            <View style={styles.correctBadge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(percentage, 5)}%` },
              isWinner && styles.barFillWinner,
              showCorrect && isCorrect && styles.barFillCorrect,
            ]}
          />
        </View>
      </View>

      {/* Right side - count and percentage */}
      <View style={styles.resultRight}>
        <Text style={[styles.countText, isWinner && styles.countTextWinner]}>
          {option.count}
        </Text>
        <Text style={styles.percentText}>{percentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  totalVotes: {
    color: COLORS.muted,
    fontSize: 14,
  },
  noResults: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  resultsContainer: {
    gap: 8,
  },
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultBarWinner: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  resultLeft: {
    marginRight: 10,
  },
  avatarContainer: {
    width: 36,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 36,
  },
  voterAvatarWrapper: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreVotersBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  moreVotersText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '700',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeWinner: {
    backgroundColor: '#4A3C00',
  },
  rankText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  resultMiddle: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionLabelWinner: {
    fontWeight: '700',
  },
  correctBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  barContainer: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  barFillWinner: {
    backgroundColor: COLORS.gold,
  },
  barFillCorrect: {
    backgroundColor: COLORS.success,
  },
  resultRight: {
    marginLeft: 10,
    alignItems: 'flex-end',
    minWidth: 40,
  },
  countText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  countTextWinner: {
    color: COLORS.gold,
  },
  percentText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  correctAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D3320',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 6,
  },
  correctAnswerLabel: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  correctAnswerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});

export default MultipleChoiceResults;
