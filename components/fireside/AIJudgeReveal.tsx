/**
 * AIJudgeReveal — Fireside presentation for AI photo judge.
 *
 * Flow per photo (tap to advance):
 *   Step 0: Photo + author name
 *   Steps 1..N: Commentary lines type in, annotations draw on
 *   Final step: Score stamp bounces in
 *   After all photos: Leaderboard
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { CampfireColors } from '../../constants/theme';
import type { AIJudgeEntry, Annotation, NonSubmitter } from './mockJudgeData';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PHOTO_SIZE = Math.min(SCREEN_W - 32, SCREEN_H * 0.48);
const TYPEWRITER_SPEED = 30; // ms per character

// ─── Typewriter Hook ───────────────────────────────────
function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      setDone(false);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, TYPEWRITER_SPEED);
    return () => clearInterval(interval);
  }, [text, active]);

  return { displayed, done };
}

// ─── SVG Annotation Overlay ────────────────────────────
function AnnotationOverlay({
  annotations,
  visibleCount,
}: {
  annotations: Annotation[];
  visibleCount: number;
}) {
  const visible = annotations.slice(0, visibleCount);

  return (
    <Svg
      width={PHOTO_SIZE}
      height={PHOTO_SIZE}
      style={StyleSheet.absoluteFill}
    >
      {visible.map((a, i) => {
        const color = a.color || '#FFD700';
        const toX = (pct: number) => (pct / 100) * PHOTO_SIZE;
        const toY = (pct: number) => (pct / 100) * PHOTO_SIZE;

        switch (a.type) {
          case 'line':
          case 'arrow':
            return (
              <React.Fragment key={i}>
                <Line
                  x1={toX(a.x1 ?? 0)}
                  y1={toY(a.y1 ?? 0)}
                  x2={toX(a.x2 ?? 0)}
                  y2={toY(a.y2 ?? 0)}
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray={a.type === 'arrow' ? undefined : '6,4'}
                />
                {a.text && (
                  <SvgText
                    x={toX(((a.x1 ?? 0) + (a.x2 ?? 0)) / 2)}
                    y={toY(((a.y1 ?? 0) + (a.y2 ?? 0)) / 2) - 6}
                    fill={color}
                    fontSize={11}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {a.text}
                  </SvgText>
                )}
              </React.Fragment>
            );

          case 'circle':
            return (
              <React.Fragment key={i}>
                <Circle
                  cx={toX(a.cx ?? 50)}
                  cy={toY(a.cy ?? 50)}
                  r={toX(a.r ?? 10)}
                  stroke={color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeDasharray="6,4"
                />
                {a.text && (
                  <SvgText
                    x={toX(a.cx ?? 50)}
                    y={toY(a.cy ?? 50) - toX(a.r ?? 10) - 6}
                    fill={color}
                    fontSize={10}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {a.text}
                  </SvgText>
                )}
              </React.Fragment>
            );

          case 'label':
            return (
              <SvgText
                key={i}
                x={toX(a.cx ?? 50)}
                y={toY(a.cy ?? 50)}
                fill={color}
                fontSize={11}
                fontWeight="bold"
                textAnchor="middle"
              >
                {a.text}
              </SvgText>
            );

          default:
            return null;
        }
      })}
    </Svg>
  );
}

// ─── Score Stamp ───────────────────────────────────────
function ScoreStamp({ score, visible }: { score: number; visible: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-15deg', '5deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.stampContainer,
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      <View style={styles.stampOuter}>
        <View style={styles.stampInner}>
          <Text style={styles.stampScore}>{score.toFixed(2)}</Text>
          <Text style={styles.stampLabel}>/ 10</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Commentary Display ────────────────────────────────
function CommentaryLine({
  text,
  active,
  alreadyShown,
}: {
  text: string;
  active: boolean;
  alreadyShown: boolean;
}) {
  const { displayed, done } = useTypewriter(text, active);

  if (alreadyShown) {
    return <Text style={styles.commentLine}>{text}</Text>;
  }

  if (!active) return null;

  return (
    <Text style={styles.commentLine}>
      {displayed}
      {!done && <Text style={styles.cursor}>|</Text>}
    </Text>
  );
}

// ─── Leaderboard Screen ────────────────────────────────
function LeaderboardScreen({
  entries,
  challengeTitle,
}: {
  entries: AIJudgeEntry[];
  challengeTitle: string;
}) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const BONUS_POINTS = [5, 4, 3]; // 1st, 2nd, 3rd place bonus

  const getMedal = (rank: number) => {
    if (rank === 0) return '1st';
    if (rank === 1) return '2nd';
    if (rank === 2) return '3rd';
    return `${rank + 1}th`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 0) return '#FFD700';
    if (rank === 1) return '#C0C0C0';
    if (rank === 2) return '#CD7F32';
    return CampfireColors.MUTED;
  };

  return (
    <Animated.View style={[styles.leaderboardContainer, { opacity: fadeAnim }]}>
      <Text style={styles.leaderboardTitle}>FINAL RANKINGS</Text>
      <Text style={styles.leaderboardSubtitle}>{challengeTitle}</Text>

      {sorted.map((entry, rank) => (
        <Animated.View
          key={entry.user_id}
          style={[
            styles.leaderboardRow,
            rank === 0 && styles.leaderboardRowWinner,
          ]}
        >
          <Text style={[styles.leaderboardRank, { color: getRankColor(rank) }]}>
            {getMedal(rank)}
          </Text>
          <Text style={styles.leaderboardName} numberOfLines={1}>
            {entry.username}
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={[styles.leaderboardScore, { color: getRankColor(rank) }]}
            >
              {entry.score.toFixed(2)}
            </Text>
            {rank < BONUS_POINTS.length && (
              <Text style={{ color: '#4ADE80', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                +{BONUS_POINTS[rank]} pts
              </Text>
            )}
          </View>
        </Animated.View>
      ))}

      <View style={styles.leaderboardFooter}>
        <Text style={styles.footerText}>
          Judged by AI with absolute precision and zero mercy.
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Shame Screen ──────────────────────────────────────
function ShameScreen({
  nonSubmitters,
}: {
  nonSubmitters: NonSubmitter[];
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const penaltyScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(penaltyScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.shameContainer, { opacity: fadeAnim }]}>
      <Text style={styles.shameTitle}>FAILURE TO APPEAR</Text>
      <View style={styles.introDivider} />
      <Text style={styles.shameSubtitle}>
        The following individuals did not submit a photo.
      </Text>

      {nonSubmitters.map((ns) => (
        <View key={ns.user_id} style={styles.shameRow}>
          <Text style={styles.shameName}>{ns.username}</Text>
          <Animated.Text
            style={[
              styles.shamePenalty,
              { transform: [{ scale: penaltyScale }] },
            ]}
          >
            -5 pts
          </Animated.Text>
        </View>
      ))}

      <Text style={styles.shameQuote}>
        "No submission. No mercy.{'\n'}The algorithm does not forget."
      </Text>
    </Animated.View>
  );
}

// ─── Main Component ────────────────────────────────────
interface AIJudgeRevealProps {
  entries: AIJudgeEntry[];
  nonSubmitters?: NonSubmitter[];
  photoUrls: Record<string, string>; // user_id -> signed URL
  challengeTitle: string;
  onComplete?: () => void;
}

export default function AIJudgeReveal({
  entries,
  nonSubmitters = [],
  photoUrls,
  challengeTitle,
  onComplete,
}: AIJudgeRevealProps) {
  // -2 = intro, -1 = shame, 0..N = photos, N+ = leaderboard
  const hasShame = nonSubmitters.length > 0;
  const [currentEntryIndex, setCurrentEntryIndex] = useState(-2);
  const [revealStep, setRevealStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const introFade = useRef(new Animated.Value(0)).current;
  // step 0: photo + name shown
  // step 1..N: each commentary line types in (annotation shows at same time if available)
  // step N+1: score stamp

  // Fade in intro screen
  useEffect(() => {
    if (currentEntryIndex === -2) {
      Animated.timing(introFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [currentEntryIndex]);

  const isIntro = currentEntryIndex === -2;
  const isShame = currentEntryIndex === -1;
  const isLeaderboard = currentEntryIndex >= entries.length;
  const entry = !isIntro && !isShame && !isLeaderboard
    ? entries[currentEntryIndex]
    : null;

  const totalSteps = entry
    ? entry.commentary.length + 1 // +1 for score stamp
    : 0;

  const handleTap = useCallback(() => {
    if (isIntro) {
      // Go to shame screen if there are non-submitters, otherwise straight to photos
      setCurrentEntryIndex(hasShame ? -1 : 0);
      setRevealStep(0);
      return;
    }

    if (isShame) {
      setCurrentEntryIndex(0);
      setRevealStep(0);
      return;
    }

    if (isLeaderboard) {
      onComplete?.();
      return;
    }

    if (revealStep < totalSteps) {
      setRevealStep((s) => s + 1);
    } else {
      // Move to next entry or leaderboard
      setCurrentEntryIndex((i) => i + 1);
      setRevealStep(0);
    }
  }, [isIntro, isShame, hasShame, isLeaderboard, revealStep, totalSteps, onComplete]);

  // ─── Intro Screen ──────────────────────────────────────
  if (isIntro) {
    return (
      <Pressable style={styles.container} onPress={handleTap}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.introContainer, { opacity: introFade }]}>
          <Text style={styles.introIcon}>{'{ AI }'}</Text>
          <Text style={styles.introTitle}>{challengeTitle}</Text>
          <View style={styles.introDivider} />
          <Text style={styles.introSubtitle}>Judged by a Robot</Text>
          <Text style={styles.introQuote}>
            "My analysis is flawless. My scores are final.{'\n'}I have no emotions, only precision."
          </Text>
          <Text style={styles.introDisclaimer}>
            {entries.length} submissions will be evaluated{'\n'}with absolute objectivity and zero mercy.
          </Text>
        </Animated.View>
        <Text style={styles.tapHint}>Tap to begin analysis</Text>
      </Pressable>
    );
  }

  // ─── Shame Screen ──────────────────────────────────────
  if (isShame) {
    return (
      <Pressable style={styles.container} onPress={handleTap}>
        <StatusBar barStyle="light-content" />
        <ShameScreen nonSubmitters={nonSubmitters} />
        <Text style={styles.tapHint}>Tap to proceed to analysis</Text>
      </Pressable>
    );
  }

  // ─── Leaderboard Screen ────────────────────────────────
  if (isLeaderboard) {
    return (
      <Pressable style={styles.container} onPress={handleTap}>
        <StatusBar barStyle="light-content" />
        <LeaderboardScreen entries={entries} challengeTitle={challengeTitle} />
        <Text style={styles.tapHint}>Tap to close</Text>
      </Pressable>
    );
  }

  if (!entry) return null;

  const photoUrl = photoUrls[entry.user_id];
  const commentaryRevealCount = Math.min(revealStep, entry.commentary.length);
  const showStamp = revealStep > entry.commentary.length;
  // Show annotations progressively — one per commentary line
  const annotationCount = Math.min(
    commentaryRevealCount,
    entry.annotations.length
  );

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.challengeLabel}>{challengeTitle}</Text>
        <Text style={styles.entryCounter}>
          {currentEntryIndex + 1} / {entries.length}
        </Text>
      </View>

      {/* Photo + Overlays */}
      <View style={styles.photoWrapper}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        )}

        {/* SVG annotation overlay */}
        <AnnotationOverlay
          annotations={entry.annotations}
          visibleCount={annotationCount}
        />

        {/* Score stamp */}
        <ScoreStamp score={entry.score} visible={showStamp} />
      </View>

      {/* Author */}
      <Text style={styles.authorName}>{entry.username}</Text>

      {/* Commentary scroll area */}
      <ScrollView
        ref={scrollRef}
        style={styles.commentaryScroll}
        contentContainerStyle={styles.commentaryContent}
        showsVerticalScrollIndicator={true}
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {entry.commentary.map((line, i) => {
          const isActive = i === commentaryRevealCount - 1 && revealStep <= entry.commentary.length;
          const alreadyShown = i < commentaryRevealCount - 1 || (i < commentaryRevealCount && revealStep > entry.commentary.length);
          if (i >= commentaryRevealCount) return null;
          return (
            <CommentaryLine
              key={`${currentEntryIndex}-${i}`}
              text={line}
              active={isActive}
              alreadyShown={alreadyShown}
            />
          );
        })}
      </ScrollView>

      {/* Tap hint */}
      <Text style={styles.tapHint}>
        {revealStep === 0
          ? 'Tap to analyze'
          : revealStep <= totalSteps
            ? 'Tap to continue'
            : 'Tap for next photo'}
      </Text>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A14',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
  },

  // Header
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeLabel: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  entryCounter: {
    color: CampfireColors.MUTED,
    fontSize: 14,
    fontWeight: '600',
  },

  // Photo
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: CampfireColors.MUTED,
    fontSize: 14,
  },

  // Intro screen
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  introIcon: {
    color: '#FFD700',
    fontSize: 32,
    fontFamily: 'monospace',
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 24,
  },
  introTitle: {
    color: CampfireColors.TEXT,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  introDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    marginBottom: 16,
  },
  introSubtitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  introQuote: {
    color: '#B8E6B8',
    fontSize: 15,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  introDisclaimer: {
    color: CampfireColors.MUTED,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Shame screen
  shameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  shameTitle: {
    color: '#FF4444',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
  },
  shameSubtitle: {
    color: CampfireColors.MUTED,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  shameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 50, 50, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  shameName: {
    color: CampfireColors.TEXT,
    fontSize: 20,
    fontWeight: '700',
  },
  shamePenalty: {
    color: '#FF4444',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shameQuote: {
    color: 'rgba(255, 68, 68, 0.6)',
    fontSize: 13,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 28,
  },

  // Author
  authorName: {
    color: CampfireColors.TEXT,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },

  // Commentary
  commentaryScroll: {
    flex: 1,
    width: '100%',
  },
  commentaryContent: {
    paddingBottom: 20,
  },
  commentLine: {
    color: '#B8E6B8',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  cursor: {
    color: '#FFD700',
    fontWeight: '300',
  },

  // Score stamp
  stampContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(180, 20, 0, 0.92)',
    borderWidth: 4,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  stampInner: {
    alignItems: 'center',
  },
  stampScore: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stampLabel: {
    color: 'rgba(255, 215, 0, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },

  // Tap hint
  tapHint: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginBottom: 40,
    marginTop: 8,
  },

  // Leaderboard
  leaderboardContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
  },
  leaderboardTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  leaderboardSubtitle: {
    color: CampfireColors.MUTED,
    fontSize: 14,
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  leaderboardRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  leaderboardRowWinner: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  leaderboardRank: {
    width: 40,
    fontSize: 16,
    fontWeight: '800',
  },
  leaderboardName: {
    flex: 1,
    color: CampfireColors.TEXT,
    fontSize: 18,
    fontWeight: '600',
  },
  leaderboardScore: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  leaderboardFooter: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    color: CampfireColors.MUTED,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
