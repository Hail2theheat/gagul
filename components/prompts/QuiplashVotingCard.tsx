/**
 * QuiplashVotingCard - Mid-week quiplash voting component
 * Shows matchups and allows users to vote
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  getQuiplashMatchups,
  submitQuiplashVote,
  QuiplashMatchup,
} from '../../lib/services/quiplashService';

const COLORS = {
  bg: '#0B1026',
  card: 'rgba(20, 30, 50, 0.85)',
  border: '#2a3f5f',
  text: '#FFF8DC',
  muted: '#B8A88A',
  accent: '#FF6B35',
  purple: '#8B5CF6',
  green: '#4ADE80',
  gold: '#FFD700',
};

interface QuiplashVotingCardProps {
  groupId: string;
  onVoted?: () => void;
}

export function QuiplashVotingCard({ groupId, onVoted }: QuiplashVotingCardProps) {
  const [loading, setLoading] = useState(true);
  const [matchups, setMatchups] = useState<QuiplashMatchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatchups();
  }, [groupId]);

  const loadMatchups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuiplashMatchups(groupId);
      // Filter to only show matchups user can vote on and hasn't voted on
      const votable = data.filter(m => m.can_vote && !m.has_voted && m.responses.length >= 2);
      setMatchups(votable);
    } catch (e: any) {
      setError(e?.message || 'Failed to load matchups');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (responseId: string) => {
    const matchup = matchups[currentMatchupIndex];
    if (!matchup) return;

    setSubmitting(true);
    try {
      const result = await submitQuiplashVote(matchup.matchup_id, responseId);
      if (result.success) {
        // Move to next matchup or finish
        if (currentMatchupIndex < matchups.length - 1) {
          setCurrentMatchupIndex(currentMatchupIndex + 1);
        } else {
          // All done
          setMatchups([]);
          onVoted?.();
        }
      } else {
        setError(result.error || 'Failed to vote');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={COLORS.purple} />
        <Text style={styles.loadingText}>Loading matchups...</Text>
      </View>
    );
  }

  if (matchups.length === 0) {
    return null; // No voting needed
  }

  const currentMatchup = matchups[currentMatchupIndex];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚔️ QUIPLASH VOTE</Text>
        </View>
        <Text style={styles.progress}>
          {currentMatchupIndex + 1} / {matchups.length}
        </Text>
      </View>

      {/* Prompt */}
      <Text style={styles.promptText}>{currentMatchup.prompt_content}</Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Responses to vote on */}
      <View style={styles.responsesContainer}>
        <Text style={styles.votePrompt}>Which answer is better?</Text>

        {currentMatchup.responses.map((response, index) => (
          <Pressable
            key={response.response_id}
            style={[styles.responseOption, submitting && styles.responseDisabled]}
            onPress={() => handleVote(response.response_id)}
            disabled={submitting}
          >
            <Text style={styles.responseLabel}>
              {index === 0 ? 'A' : 'B'}
            </Text>
            <Text style={styles.responseText}>
              "{response.content}"
            </Text>
          </Pressable>
        ))}
      </View>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="small" color={COLORS.text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.purple,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: COLORS.purple + '30',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  progress: {
    color: COLORS.muted,
    fontSize: 12,
  },
  promptText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  responsesContainer: {
    gap: 12,
  },
  votePrompt: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  responseOption: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: COLORS.purple + '50',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  responseDisabled: {
    opacity: 0.5,
  },
  responseLabel: {
    color: COLORS.purple,
    fontSize: 18,
    fontWeight: '900',
    width: 24,
  },
  responseText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
    fontStyle: 'italic',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
