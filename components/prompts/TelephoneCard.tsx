/**
 * TelephoneCard - Main component for Telephone game prompts
 * Handles both draw and write steps
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { DrawingCanvas } from './DrawingCanvas';
import {
  TelephoneAssignment,
  uploadDrawing,
  submitTelephoneStep,
  getDrawingUrl,
} from '../../lib/services/telephoneService';
import { awardResponsePoints } from '../../lib/services/pointsService';

const COLORS = {
  bg: '#0D1426',
  card: '#1A1A2E',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9CA3AF',
  accent: '#FF6B35',
  purple: '#8B5CF6',
  success: '#4ADE80',
};

interface TelephoneCardProps {
  assignment: TelephoneAssignment;
  groupId: string;
  onSubmitted?: () => void;
}

export function TelephoneCard({ assignment, groupId, onSubmitted }: TelephoneCardProps) {
  const [previousDrawingUrl, setPreviousDrawingUrl] = useState<string | null>(null);
  const [writeContent, setWriteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDrawStep = assignment.step_type === 'draw';
  const stepNumber = assignment.step_number || 1;

  // Load previous drawing URL if this is a write step
  useEffect(() => {
    const loadPreviousDrawing = async () => {
      if (!isDrawStep && assignment.previous_drawing_url) {
        const url = await getDrawingUrl(assignment.previous_drawing_url);
        setPreviousDrawingUrl(url);
      }
    };
    loadPreviousDrawing();
  }, [assignment.previous_drawing_url, isDrawStep]);

  // Get the prompt/content to show the user
  const getPromptContent = () => {
    if (stepNumber === 1) {
      // First step shows initial prompt
      return assignment.initial_prompt || 'Draw something!';
    } else if (isDrawStep) {
      // Drawing step shows previous person's written description
      return assignment.previous_content || 'Draw what you see!';
    } else {
      // Writing step shows previous drawing
      return 'Describe this drawing:';
    }
  };

  const handleDrawingSave = async (imageUri: string) => {
    if (submitting || !assignment.step_id) return;

    setError(null);
    setSubmitting(true);

    try {
      // Upload the drawing
      const uploadResult = await uploadDrawing(groupId, assignment.step_id, imageUri);
      if (uploadResult.error) {
        setError(uploadResult.error);
        setSubmitting(false);
        return;
      }

      // Submit the step
      const result = await submitTelephoneStep(
        assignment.step_id,
        undefined,
        uploadResult.url || undefined
      );

      if (result.success) {
        setSubmitted(true);
        // Award points for response (treat as photo since it's a drawing)
        await awardResponsePoints(groupId, assignment.step_id, true);
        onSubmitted?.();
      } else {
        setError(result.error || 'Failed to submit');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWriteSubmit = async () => {
    if (submitting || !assignment.step_id || !writeContent.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await submitTelephoneStep(
        assignment.step_id,
        writeContent.trim(),
        undefined
      );

      if (result.success) {
        setSubmitted(true);
        // Award points for response
        await awardResponsePoints(groupId, assignment.step_id, false);
        onSubmitted?.();
      } else {
        setError(result.error || 'Failed to submit');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.card}>
        <View style={styles.submittedBox}>
          <Text style={styles.submittedEmoji}>
            {isDrawStep ? '🎨' : '✏️'}
          </Text>
          <Text style={styles.submittedText}>
            {isDrawStep ? 'Drawing submitted!' : 'Description submitted!'}
          </Text>
          <Text style={styles.submittedHint}>
            Check back tomorrow to continue the chain
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {isDrawStep ? '🎨 DRAW' : '✏️ DESCRIBE'}
          </Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step {stepNumber}/4</Text>
        </View>
      </View>

      {/* Game explanation */}
      <View style={styles.explainer}>
        <Text style={styles.explainerTitle}>📞 Telephone Game</Text>
        <Text style={styles.explainerText}>
          {stepNumber === 1
            ? "Draw the prompt below. Tomorrow, someone will try to guess what you drew!"
            : isDrawStep
            ? "Someone described a drawing. Now draw what they wrote!"
            : "Look at this drawing and describe what you see!"}
        </Text>
      </View>

      {/* Prompt/Content */}
      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>
          {stepNumber === 1 ? 'Draw this:' : isDrawStep ? 'Draw this description:' : 'Describe this drawing:'}
        </Text>

        {/* Show previous drawing for write steps */}
        {!isDrawStep && stepNumber > 1 && (
          previousDrawingUrl ? (
            <Image
              source={{ uri: previousDrawingUrl }}
              style={styles.previousDrawing}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.loadingDrawing}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading drawing...</Text>
            </View>
          )
        )}

        {/* Show text prompt for draw steps */}
        {(isDrawStep || stepNumber === 1) && (
          <Text style={styles.promptContent}>"{getPromptContent()}"</Text>
        )}
      </View>

      {/* Input based on step type */}
      {isDrawStep ? (
        <DrawingCanvas
          onSave={handleDrawingSave}
          disabled={submitting}
        />
      ) : (
        <View style={styles.writeSection}>
          <TextInput
            style={styles.writeInput}
            placeholder="Describe what you see in the drawing..."
            placeholderTextColor={COLORS.muted}
            value={writeContent}
            onChangeText={setWriteContent}
            multiline
            maxLength={200}
            editable={!submitting}
          />
          <Text style={styles.charCount}>
            {writeContent.length}/200
          </Text>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!writeContent.trim() || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleWriteSubmit}
            disabled={!writeContent.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Description</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: COLORS.purple + '30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  stepBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  explainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  explainerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  explainerText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  promptBox: {
    gap: 12,
  },
  promptLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  promptContent: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  previousDrawing: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  loadingDrawing: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  writeSection: {
    gap: 12,
  },
  writeInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  submittedBox: {
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  submittedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  submittedText: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: '700',
  },
  submittedHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TelephoneCard;
