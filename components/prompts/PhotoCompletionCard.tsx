/**
 * PhotoCompletionCard - Two-phase photo completion game card
 * Phase 1 (submit_cutoff): User takes a cutoff photo
 * Phase 2 (submit_completion): User completes another user's cutoff photo
 *
 * Shows an animated infographic intro explaining the game, then
 * transitions to the photo submission form when the user taps "Got it!"
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  FadeIn,
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_SNAPPY } from '../../constants/animations';
import { CampfireColors, Radii } from '../../constants/theme';
import { PhotoPicker } from './PhotoPicker';
import { getSignedImageUrl } from '../../lib/services/firesideService';
import {
  submitCutoffPhoto,
  submitCompletionPhoto,
} from '../../lib/services/photoCompletionService';
import type { PhotoCompletionState } from '../../lib/types/photoCompletion';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PhotoCompletionCardProps {
  groupId: string;
  gameState: PhotoCompletionState;
  onSubmitted?: () => void;
}

// ─── Pixel Art Infographic Components ───────────────────────────

/** Block-style pixel person */
function PixelPerson({ color, size = 1, cutoff }: { color: string; size?: number; cutoff?: 'right' | 'left' }) {
  const s = size;
  const headSize = 12 * s;
  const bodyW = 16 * s;
  const bodyH = 18 * s;
  const legH = 12 * s;
  const armW = 6 * s;

  return (
    <View style={{ alignItems: 'center', overflow: cutoff ? 'hidden' : undefined, width: cutoff ? bodyW * 0.6 : undefined }}>
      <View style={{ width: headSize, height: headSize, borderRadius: headSize / 2, backgroundColor: color }} />
      <View style={{ flexDirection: 'row', marginTop: 1 }}>
        {cutoff !== 'left' && (
          <View style={{ width: armW, height: bodyH - 6, backgroundColor: color, borderRadius: 2 * s, marginTop: 6, marginRight: 1 }} />
        )}
        <View style={{ width: bodyW, height: bodyH, backgroundColor: color, borderRadius: 3 * s }} />
        {cutoff !== 'right' && (
          <View style={{ width: armW, height: bodyH - 6, backgroundColor: color, borderRadius: 2 * s, marginTop: 6, marginLeft: 1 }} />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 3 * s, marginTop: 1 }}>
        <View style={{ width: 6 * s, height: legH, backgroundColor: color, borderRadius: 2 * s }} />
        <View style={{ width: 6 * s, height: legH, backgroundColor: color, borderRadius: 2 * s }} />
      </View>
    </View>
  );
}

/** Dashed photo frame box */
function Frame({ children, label, accent }: { children: React.ReactNode; label?: string; accent?: boolean }) {
  return (
    <View style={[ig.frame, accent && ig.frameAccent]}>
      {children}
      {label && <Text style={[ig.frameLabel, accent && ig.frameLabelAccent]}>{label}</Text>}
    </View>
  );
}

/** Animated pulsing glow dot */
function PulseGlow() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[ig.pulseGlow, style]} />
  );
}

/** Red dashed cutoff line */
function CutoffEdge() {
  return (
    <View style={ig.cutoffEdge}>
      <View style={ig.cutoffDash} />
      <View style={ig.cutoffDash} />
      <View style={ig.cutoffDash} />
      <View style={ig.cutoffDash} />
      <View style={ig.cutoffDash} />
    </View>
  );
}

/** Right-pointing arrow with label */
function StepArrow({ label, delay = 0 }: { label: string; delay?: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)} style={ig.arrowBox}>
      <View style={ig.arrowLine} />
      <View style={ig.arrowHead} />
      <Text style={ig.arrowLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Infographic Intro Screen ───────────────────────────────────

function InfoIntro({ isPhase1, onReady }: { isPhase1: boolean; onReady: () => void }) {
  const readyScale = useSharedValue(1);
  const readyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: readyScale.value }],
  }));

  return (
    <View style={ig.container}>
      {/* Title */}
      <Animated.Text entering={FadeInDown.delay(100).springify().damping(14)} style={ig.title}>
        How Photo Completion Works
      </Animated.Text>

      {/* Step 1 */}
      <Animated.View entering={FadeInDown.delay(300).springify().damping(14)} style={ig.step}>
        <View style={ig.stepHeader}>
          <View style={ig.badge}><Text style={ig.badgeText}>1</Text></View>
          <Text style={ig.stepTitle}>
            {isPhase1 ? 'Take a Cutoff Photo' : 'Someone took a cutoff photo'}
          </Text>
        </View>
        <View style={ig.demoRow}>
          <Frame label="Photo">
            <View style={ig.demoFrame}>
              <PixelPerson color={CampfireColors.FIRE_ORANGE} cutoff="right" />
              <CutoffEdge />
            </View>
          </Frame>
          <View style={ig.demoExplain}>
            <Text style={ig.demoText}>
              {isPhase1
                ? 'Part of you is cut off at the frame edge'
                : 'Part of them is cut off at the edge'}
            </Text>
            {isPhase1 && (
              <View style={ig.ideaList}>
                <Text style={ig.ideaItem}>- Hand reaching out</Text>
                <Text style={ig.ideaItem}>- Legs only</Text>
                <Text style={ig.ideaItem}>- Peek around corner</Text>
                <Text style={ig.ideaItem}>- Half face at edge</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Step 2 */}
      <Animated.View entering={FadeInDown.delay(600).springify().damping(14)} style={ig.step}>
        <View style={ig.stepHeader}>
          <View style={ig.badge}><Text style={ig.badgeText}>2</Text></View>
          <Text style={ig.stepTitle}>
            {isPhase1 ? 'Someone completes your photo' : 'You complete their photo'}
          </Text>
        </View>
        <View style={ig.mergeDemo}>
          <Animated.View entering={FadeInLeft.delay(800).duration(400)}>
            <Frame>
              <View style={ig.demoFrameSmall}>
                <PixelPerson color={CampfireColors.FIRE_ORANGE} size={0.8} cutoff="right" />
                <CutoffEdge />
              </View>
            </Frame>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(1000).duration(300)} style={ig.plusSign}>
            <Text style={ig.plusText}>+</Text>
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(1200).duration(400)}>
            <Frame accent>
              <View style={ig.demoFrameSmall}>
                <CutoffEdge />
                <PixelPerson color={CampfireColors.ACCENT_PURPLE} size={0.8} cutoff="left" />
              </View>
            </Frame>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Step 3 */}
      <Animated.View entering={FadeInDown.delay(1400).springify().damping(14)} style={ig.step}>
        <View style={ig.stepHeader}>
          <View style={ig.badge}><Text style={ig.badgeText}>3</Text></View>
          <Text style={ig.stepTitle}>AI merges them at Fireside</Text>
        </View>
        <Animated.View entering={ZoomIn.delay(1700).springify().damping(12)} style={ig.mergedDemo}>
          <Frame label="AI Merged">
            <View style={ig.demoFrameWide}>
              <PixelPerson color={CampfireColors.FIRE_ORANGE} size={0.8} />
              <PulseGlow />
              <View style={ig.aiBadge}>
                <Text style={ig.aiBadgeText}>AI</Text>
              </View>
              <PulseGlow />
              <PixelPerson color={CampfireColors.ACCENT_PURPLE} size={0.8} />
            </View>
          </Frame>
        </Animated.View>
      </Animated.View>

      {/* Got it button */}
      <Animated.View entering={FadeInDown.delay(2000).springify().damping(14)}>
        <Animated.View style={readyStyle}>
          <Pressable
            style={ig.readyButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onReady();
            }}
            onPressIn={() => { readyScale.value = withSpring(0.96, SPRING_SNAPPY); }}
            onPressOut={() => { readyScale.value = withSpring(1, SPRING_SNAPPY); }}
          >
            <Text style={ig.readyText}>
              {isPhase1 ? "Got it — let's go!" : "Got it — show me the photo!"}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Main Card ──────────────────────────────────────────────────

export function PhotoCompletionCard({
  groupId,
  gameState,
  onSubmitted,
}: PhotoCompletionCardProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(gameState.has_submitted);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const submitScale = useSharedValue(1);
  const submitAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  // For Phase 2, load the signed URL of the assigned cutoff photo
  useEffect(() => {
    if (gameState.phase === 'submit_completion' && gameState.assigned_photo_url) {
      getSignedImageUrl(gameState.assigned_photo_url).then((url) => {
        if (url) setSignedPhotoUrl(url);
      });
    }
  }, [gameState.phase, gameState.assigned_photo_url]);

  const handleSubmit = async () => {
    if (!photoUri || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      let result;
      if (gameState.phase === 'submit_cutoff' && gameState.cutoff_group_prompt_id) {
        result = await submitCutoffPhoto(groupId, gameState.cutoff_group_prompt_id, photoUri);
      } else if (gameState.phase === 'submit_completion' && gameState.completion_group_prompt_id) {
        result = await submitCompletionPhoto(groupId, gameState.completion_group_prompt_id, photoUri);
      } else {
        result = { success: false, error: 'Invalid game phase' };
      }

      if (result.success) {
        setSubmitted(true);
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

  // ── Submitted state ──
  if (submitted) {
    return (
      <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.card}>
        <View style={styles.submittedBox}>
          <Text style={styles.submittedText}>
            {gameState.phase === 'submit_cutoff' ? 'Cutoff submitted!' : 'Completion submitted!'}
          </Text>
          <Text style={styles.submittedHint}>
            {gameState.phase === 'submit_cutoff'
              ? "Tomorrow you'll complete someone else's photo"
              : "See the merged results at Fireside!"}
          </Text>
        </View>
      </Animated.View>
    );
  }

  const isPhase1 = gameState.phase === 'submit_cutoff';

  // ── Infographic intro ──
  if (showIntro) {
    return (
      <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.card}>
        <Text style={styles.gameLabel}>PHOTO COMPLETION</Text>
        <InfoIntro isPhase1={isPhase1} onReady={() => setShowIntro(false)} />
      </Animated.View>
    );
  }

  // ── Submission form ──
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <Text style={styles.gameLabel}>PHOTO COMPLETION</Text>
      <Text style={styles.title}>
        {isPhase1 ? 'Take a Cutoff Photo' : 'Complete This Photo'}
      </Text>

      {/* Inline mini-reminder */}
      <Pressable
        style={styles.reminderPill}
        onPress={() => setShowIntro(true)}
      >
        <Text style={styles.reminderText}>
          {isPhase1
            ? 'Cut yourself off at the frame edge'
            : `Extend ${gameState.assigned_username || "their"}'s photo`}
        </Text>
        <Text style={styles.reminderLink}>How?</Text>
      </Pressable>

      {/* Phase 2: Show the cutoff photo to complete */}
      {!isPhase1 && signedPhotoUrl && (
        <Animated.View entering={FadeInDown.delay(100).springify().damping(14)} style={styles.assignedPhotoContainer}>
          <Text style={styles.assignedLabel}>
            {gameState.assigned_username}'s cutoff photo:
          </Text>
          <Image
            source={{ uri: signedPhotoUrl }}
            style={styles.assignedPhoto}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {!isPhase1 && !signedPhotoUrl && gameState.assigned_photo_url && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={CampfireColors.BTN_PRIMARY} />
          <Text style={styles.loadingText}>Loading assigned photo...</Text>
        </View>
      )}

      {/* Photo picker */}
      <PhotoPicker
        value={photoUri}
        onChange={setPhotoUri}
        disabled={submitting}
      />

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Submit */}
      <Animated.View style={submitAnimStyle}>
        <Pressable
          style={[
            styles.submitButton,
            !photoUri && styles.submitButtonDisabled,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleSubmit();
          }}
          onPressIn={() => { submitScale.value = withSpring(0.96, SPRING_SNAPPY); }}
          onPressOut={() => { submitScale.value = withSpring(1, SPRING_SNAPPY); }}
          disabled={!photoUri || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={CampfireColors.TEXT} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isPhase1 ? 'Submit Cutoff' : 'Submit Completion'}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Infographic Styles ─────────────────────────────────────────

const ig = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 4,
  },
  title: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 16,
    fontFamily: 'Paaxel',
    textAlign: 'center',
    marginBottom: 4,
  },
  step: {
    backgroundColor: CampfireColors.BG + 'AA',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: CampfireColors.BORDER + '60',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CampfireColors.FIRE_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTitle: {
    color: CampfireColors.TEXT,
    fontSize: 14,
    fontFamily: 'Paaxel',
    flex: 1,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  demoExplain: {
    flex: 1,
    gap: 6,
  },
  demoText: {
    color: CampfireColors.MUTED,
    fontSize: 12,
    fontFamily: 'Paaxel',
    lineHeight: 16,
  },
  demoFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 4,
    gap: 2,
  },
  demoFrameSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 2,
    gap: 2,
  },
  demoFrameWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 8,
    gap: 8,
  },
  frame: {
    borderWidth: 1,
    borderColor: CampfireColors.MUTED + '50',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    gap: 2,
    backgroundColor: CampfireColors.BG + '60',
  },
  frameAccent: {
    borderColor: CampfireColors.FIRE_ORANGE + '80',
    backgroundColor: CampfireColors.FIRE_ORANGE + '08',
  },
  frameLabel: {
    color: CampfireColors.MUTED,
    fontSize: 9,
    fontFamily: 'Paaxel',
  },
  frameLabelAccent: {
    color: CampfireColors.FIRE_ORANGE,
  },
  cutoffEdge: {
    width: 3,
    height: 44,
    gap: 3,
    justifyContent: 'center',
  },
  cutoffDash: {
    width: 3,
    height: 6,
    backgroundColor: CampfireColors.DANGER,
    borderRadius: 1,
  },
  mergeDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusSign: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CampfireColors.FIRE_YELLOW + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 16,
    fontWeight: '700',
  },
  mergedDemo: {
    alignItems: 'center',
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CampfireColors.FIRE_YELLOW + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CampfireColors.FIRE_YELLOW + '60',
  },
  aiBadgeText: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 10,
    fontWeight: '800',
  },
  pulseGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CampfireColors.FIRE_YELLOW,
  },
  ideaList: {
    gap: 2,
    paddingLeft: 2,
  },
  ideaItem: {
    color: CampfireColors.MUTED + 'CC',
    fontSize: 11,
    fontFamily: 'Paaxel',
  },
  arrowBox: {
    alignItems: 'center',
    gap: 2,
  },
  arrowLine: {
    width: 16,
    height: 2,
    backgroundColor: CampfireColors.MUTED,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderLeftColor: CampfireColors.MUTED,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'absolute',
    right: -3,
  },
  arrowLabel: {
    color: CampfireColors.MUTED,
    fontSize: 8,
    fontFamily: 'Paaxel',
  },
  readyButton: {
    backgroundColor: CampfireColors.BTN_PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  readyText: {
    color: CampfireColors.TEXT,
    fontSize: 15,
    fontFamily: 'Paaxel',
    fontWeight: '600',
  },
});

// ─── Card Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: CampfireColors.CARD,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: CampfireColors.BORDER,
    padding: 20,
    gap: 10,
  },
  gameLabel: {
    color: CampfireColors.ACCENT_PURPLE,
    fontSize: 11,
    fontFamily: 'Paaxel',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: CampfireColors.TEXT,
    fontSize: 20,
    fontFamily: 'Paaxel',
    textAlign: 'center',
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: CampfireColors.ACCENT_PURPLE + '15',
    borderWidth: 1,
    borderColor: CampfireColors.ACCENT_PURPLE + '30',
  },
  reminderText: {
    color: CampfireColors.MUTED,
    fontSize: 12,
    fontFamily: 'Paaxel',
  },
  reminderLink: {
    color: CampfireColors.ACCENT_PURPLE_LIGHT,
    fontSize: 12,
    fontFamily: 'Paaxel',
    textDecorationLine: 'underline',
  },
  assignedPhotoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  assignedLabel: {
    color: CampfireColors.FIRE_YELLOW,
    fontSize: 13,
    fontFamily: 'Paaxel',
  },
  assignedPhoto: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: CampfireColors.BG,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: CampfireColors.MUTED,
    fontSize: 13,
  },
  submittedBox: {
    backgroundColor: CampfireColors.SUCCESS + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  submittedText: {
    color: CampfireColors.SUCCESS,
    fontSize: 18,
    fontWeight: '600',
  },
  submittedHint: {
    color: CampfireColors.MUTED,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: CampfireColors.DANGER,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: CampfireColors.BTN_PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: CampfireColors.BTN_PRIMARY + '50',
  },
  submitButtonText: {
    color: CampfireColors.TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoCompletionCard;
