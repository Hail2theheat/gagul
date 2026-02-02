/**
 * QuiplashCard - displays user's assigned quiplash prompt
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getMyQuiplash, QuiplashAssignment } from '../../lib/services/quiplashService';
import { submitResponse } from '../../lib/services/promptService';
import { CountdownTimer } from './CountdownTimer';
import { WordCounter } from './WordCounter';
import { WORD_LIMITS, validateResponse } from '../../lib/types/prompts';

const COLORS = {
  bg: '#070B14',
  card: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  accent: '#8B5CF6',
  btn: '#8B5CF6',
  btnText: '#fff',
  success: '#4ADE80',
};

interface QuiplashCardProps {
  groupId: string;
  onSubmitted?: () => void;
}

export function QuiplashCard({ groupId, onSubmitted }: QuiplashCardProps) {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<QuiplashAssignment | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignment = async () => {
    setLoading(true);
    const data = await getMyQuiplash(groupId);
    setAssignment(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAssignment();
  }, [groupId]);

  const validation = validateResponse('quiplash', answer);
  const canSubmit = validation.valid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !assignment?.group_prompt_id) return;

    setError(null);
    setSubmitting(true);

    const result = await submitResponse({
      groupPromptId: assignment.group_prompt_id,
      content: answer,
    });

    setSubmitting(false);

    if (result.success) {
      await loadAssignment();
      onSubmitted?.();
    } else {
      setError(result.error || 'Failed to submit');
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!assignment?.has_assignment) {
    return null; // No quiplash assigned to this user
  }

  if (assignment.has_responded) {
    return (
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎭 Quiplash</Text>
        </View>
        <View style={styles.submittedBox}>
          <Text style={styles.submittedText}>✓ Answer submitted!</Text>
          <Text style={styles.submittedHint}>
            Your anonymous answer will face off during the Lowdown. May the funniest win!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎭 Quiplash</Text>
        </View>
        {assignment.prompt?.category && (
          <Text style={styles.category}>{assignment.prompt.category}</Text>
        )}
      </View>

      {assignment.expires_at && (
        <CountdownTimer expiresAt={assignment.expires_at} />
      )}

      <Text style={styles.promptTitle}>
        {assignment.prompt?.content || assignment.prompt?.title}
      </Text>

      <Text style={styles.hint}>
        Someone else got the same prompt. Your answers will face off anonymously!
      </Text>

      <TextInput
        style={styles.input}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Your witty answer..."
        placeholderTextColor={COLORS.muted}
        multiline
        numberOfLines={2}
        maxLength={500}
        editable={!submitting}
      />

      <WordCounter
        text={answer}
        min={WORD_LIMITS.quiplash.min}
        max={WORD_LIMITS.quiplash.max}
        showProgress={false}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={COLORS.btnText} />
        ) : (
          <Text style={styles.submitButtonText}>Lock In Answer</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.accent + '30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  category: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  promptTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  hint: {
    color: COLORS.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.btn,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.btnText,
    fontSize: 16,
    fontWeight: '700',
  },
  submittedBox: {
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  submittedText: {
    color: COLORS.success,
    fontSize: 18,
    fontWeight: '600',
  },
  submittedHint: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default QuiplashCard;
