// app/group/[id]/lowdown.tsx
import { useGlobalSearchParams, router } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";


import {
  getFiresideData,
  isFiresideUnlocked,
  getComments,
  getCommentCounts,
  updateFiresideProgress,
  getFiresideProgress,
  subscribeToComments,
  getSignedImageUrl,
  getQuiplashVoters,
  finalizeWeek,
  winnerChoosePrompt,
  FiresideData,
  FiresidePrompt,
  FiresideComment,
  WeeklyWinner,
  QuiplashVoter,
} from "../../../lib/services/firesideService";
import { awardPoints } from "../../../lib/services/pointsService";
import { supabase } from "../../../lib/supabase";
import { MultipleChoiceResults } from "../../../components/prompts/MultipleChoiceResults";
import { FiresideReactions } from "../../../components/prompts/FiresideReactions";
import { CommentSheet } from "../../../components/prompts/CommentSheet";
import { AudioPlayer } from "../../../components/prompts/AudioPlayer";
import { VideoPlayer } from "../../../components/prompts/VideoPlayer";
import { trackViewStart, trackViewEnd } from "../../../lib/services/metricsService";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "../../../components/PixelCharacter";
import { DetailedCampfire } from "../../../components/PixelArt";
import { PixelTitle } from "../../../components/PixelTitle";
import { NightSky } from "../../../components/sky";
import { FiresideIntro } from "../../../components/FiresideIntro";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Simple tree for lowdown background
function PixelTree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const treeColor = `rgba(15, ${30 + shade * 15}, ${20 + shade * 10}, 1)`;
  const trunkColor = `rgba(40, ${25 + shade * 5}, 15, 1)`;

  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.4, borderRightWidth: height * 0.4, borderBottomWidth: height * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor, marginBottom: -8 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.5, borderRightWidth: height * 0.5, borderBottomWidth: height * 0.4, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor, marginBottom: -10 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.6, borderRightWidth: height * 0.6, borderBottomWidth: height * 0.45, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor }} />
      <View style={{ width: height * 0.15, height: height * 0.2, backgroundColor: trunkColor }} />
    </View>
  );
}

// Max height for text before it hits the emoji area
const TEXT_MAX_HEIGHT = SCREEN_HEIGHT * 0.45;

// Auto-shrinking text that reduces font size to fit within maxHeight
function AutoShrinkText({
  text,
  style,
  maxHeight = TEXT_MAX_HEIGHT,
  minFontSize = 12,
}: {
  text: string;
  style: any;
  maxHeight?: number;
  minFontSize?: number;
}) {
  const baseFontSize = StyleSheet.flatten(style)?.fontSize || 22;
  const baseLineHeight = StyleSheet.flatten(style)?.lineHeight || baseFontSize * 1.4;
  const [fontSize, setFontSize] = useState(baseFontSize);
  const [lineHeight, setLineHeight] = useState(baseLineHeight);

  useEffect(() => {
    // Reset when text changes
    setFontSize(baseFontSize);
    setLineHeight(baseLineHeight);
  }, [text]);

  const onTextLayout = useCallback((e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > maxHeight && fontSize > minFontSize) {
      const scale = Math.max(minFontSize / baseFontSize, maxHeight / height * 0.95);
      const newSize = Math.max(minFontSize, Math.floor(baseFontSize * scale));
      const newLineHeight = Math.max(minFontSize * 1.3, Math.floor(baseLineHeight * scale));
      setFontSize(newSize);
      setLineHeight(newLineHeight);
    }
  }, [fontSize, maxHeight, minFontSize, baseFontSize, baseLineHeight]);

  return (
    <Text
      style={[style, { fontSize, lineHeight }]}
      onLayout={onTextLayout}
    >
      {text}
    </Text>
  );
}

// Pixel fire flame
function PixelFlame({ scale, flicker }: { scale: Animated.AnimatedInterpolation<number> | Animated.Value; flicker: Animated.Value }) {
  return (
    <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
      {/* Outer flame - orange/red */}
      <Animated.View style={{
        width: 50,
        height: 70,
        backgroundColor: "#FF4500",
        borderRadius: 25,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        transform: [{ scaleX: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
      }}>
        {/* Middle flame - orange */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 8,
          width: 34,
          height: 55,
          backgroundColor: "#FF6B35",
          borderRadius: 17,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
          {/* Inner flame - yellow */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 7,
            width: 20,
            height: 40,
            backgroundColor: "#FFD93D",
            borderRadius: 10,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}>
            {/* Core - white/yellow */}
            <View style={{
              position: "absolute",
              bottom: 0,
              left: 5,
              width: 10,
              height: 20,
              backgroundColor: "#FFFACD",
              borderRadius: 5,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
            }} />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Ember particle
function Ember({ delay, side }: { delay: number; side: "left" | "right" | "center" }) {
  const progress = useRef(new Animated.Value(0)).current;

  const xOffset = side === "left" ? -25 : side === "right" ? 25 : 0;
  const drift = side === "left" ? -15 : side === "right" ? 15 : (Math.random() - 0.5) * 20;

  useEffect(() => {
    const animate = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 4,
        height: 4,
        backgroundColor: progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ["#FFD93D", "#FF6B35", "#FF4500"],
        }) as any,
        borderRadius: 2,
        left: "50%",
        marginLeft: xOffset,
        bottom: 140,
        opacity: progress.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 0.6, 0],
        }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) },
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
        ],
      }}
    />
  );
}

// Fire spark comment component - sparks jumping from bonfire
function FloatingComment({ comment, index, total }: { comment: FiresideComment; index: number; total: number }) {
  const floatProgress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  // Random trajectory for spark effect
  const startX = useRef(SCREEN_WIDTH / 2 - 50 + Math.random() * 100).current;
  const curveDirection = useRef(Math.random() > 0.5 ? 1 : -1).current;
  const curveAmount = useRef(40 + Math.random() * 60).current;
  const endY = useRef(-300 - Math.random() * 150).current;

  useEffect(() => {
    const delay = index * 2000;

    const delayTimer = setTimeout(() => {
      setVisible(true);

      Animated.timing(floatProgress, {
        toValue: 1,
        duration: 5000 + Math.random() * 2000,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(delayTimer);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: 120,
        opacity: floatProgress.interpolate({
          inputRange: [0, 0.1, 0.7, 1],
          outputRange: [0, 1, 0.8, 0],
        }),
        transform: [
          {
            translateY: floatProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, endY],
            }),
          },
          {
            translateX: floatProgress.interpolate({
              inputRange: [0, 0.3, 0.6, 1],
              outputRange: [0, curveDirection * curveAmount * 0.5, curveDirection * curveAmount, curveDirection * curveAmount * 0.7],
            }),
          },
          {
            scale: floatProgress.interpolate({
              inputRange: [0, 0.1, 0.5, 1],
              outputRange: [0.3, 1.1, 1, 0.8],
            }),
          },
          {
            rotate: floatProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${curveDirection * 15}deg`],
            }),
          },
        ],
      }}
    >
      {/* Spark glow */}
      <View style={{
        backgroundColor: "#FF6B35",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        maxWidth: 160,
        shadowColor: "#FF4500",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: "#FFD93D",
      }}>
        <Text style={{ color: "#FFF8DC", fontSize: 13, fontFamily: "Paaxel" }}>{comment.content}</Text>
      </View>
      {/* Little spark particles */}
      <View style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: 8,
        height: 8,
        backgroundColor: "#FFD93D",
        borderRadius: 4,
        shadowColor: "#FFD93D",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }} />
      <View style={{
        position: "absolute",
        bottom: -3,
        left: 10,
        width: 5,
        height: 5,
        backgroundColor: "#FF8C00",
        borderRadius: 2.5,
      }} />
    </Animated.View>
  );
}

const COLORS = {
  bg: "#0A0A0F",
  card: "#1A1A2E",
  border: "#2D2D44",
  text: "#F5F5F5",
  muted: "#9CA3AF",
  accent: "#FF6B35", // Bonfire orange
  purple: "#8B5CF6",
  green: "#4ADE80",
  gold: "#FFD700",
};

type ScreenState = "loading" | "locked" | "intro" | "bonfire" | "prompts" | "leaderboard";

export default function LowdownScreen() {
  const params = useGlobalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : undefined;

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [firesideData, setFiresideData] = useState<FiresideData | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(-1); // -1 = show prompt
  const [revealStep, setRevealStep] = useState(0); // For quiz/MC reveals
  const [comments, setComments] = useState<FiresideComment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [firesideProgress, setFiresideProgress] = useState<Record<string, 'completed' | 'partial' | 'not_started'>>({});
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [quiplashVoters, setQuiplashVoters] = useState<QuiplashVoter[]>([]);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState("");
  const [choosingPrompt, setChoosingPrompt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const viewStartTime = useRef<number | null>(null);
  const hasAwardedFiresidePoints = useRef(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fireAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [groupId]);

  // Fetch signed URL when showing a photo response
  useEffect(() => {
    let cancelled = false;
    const fetchSignedUrl = async () => {
      const prompt = firesideData?.prompts[currentPromptIndex];
      if (currentResponseIndex >= 0 && prompt) {
        const response = prompt.responses?.[currentResponseIndex];
        if (response?.media_url) {
          console.log('[Fireside] Fetching signed URL for media:', response.media_url);
          setSignedPhotoUrl(null);
          try {
            const signedUrl = await getSignedImageUrl(response.media_url);
            if (!cancelled) {
              console.log('[Fireside] Got signed URL:', signedUrl ? 'success' : 'null');
              setSignedPhotoUrl(signedUrl);
            }
          } catch (error) {
            console.error('[Fireside] Failed to fetch signed URL:', error);
            if (!cancelled) setSignedPhotoUrl(null);
          }
        } else {
          setSignedPhotoUrl(null);
        }
      } else {
        setSignedPhotoUrl(null);
      }
    };
    fetchSignedUrl();
    return () => { cancelled = true; };
  }, [currentResponseIndex, currentPromptIndex, firesideData]);

  // Track view time for responses
  useEffect(() => {
    const prompt = firesideData?.prompts[currentPromptIndex];
    const response = prompt?.responses?.[currentResponseIndex];

    // End previous view tracking
    if (viewStartTime.current && response?.response_id) {
      trackViewEnd(response.response_id, viewStartTime.current);
    }

    // Start new view tracking
    if (currentResponseIndex >= 0 && response?.response_id) {
      viewStartTime.current = trackViewStart(response.response_id);
    } else {
      viewStartTime.current = null;
    }

    return () => {
      if (viewStartTime.current && response?.response_id) {
        trackViewEnd(response.response_id, viewStartTime.current);
      }
    };
  }, [currentResponseIndex, currentPromptIndex]);

  // Load and subscribe to comments for current response
  useEffect(() => {
    const prompt = firesideData?.prompts[currentPromptIndex];
    const promptResponses = prompt?.responses || [];
    const isQuizOrMCPrompt = prompt && ["quiz", "multiple_choice"].includes(prompt.type);
    const isQuiplashPrompt = prompt?.type === "quiplash";

    // For quiz/MC/quiplash, use first response as anchor; for others, use current response
    let response;
    if ((isQuizOrMCPrompt || isQuiplashPrompt) && promptResponses.length > 0) {
      response = promptResponses[0]; // Use first response for quiz/MC/quiplash
    } else if (currentResponseIndex >= 0) {
      response = promptResponses[currentResponseIndex];
    }

    if (!response?.response_id) {
      setComments([]);
      return;
    }

    const responseId = response.response_id;

    // Load existing comments
    const loadComments = async () => {
      const existingComments = await getComments(responseId);
      setComments(existingComments);
    };
    loadComments();

    // Subscribe to new comments
    const unsubscribe = subscribeToComments(responseId, (newComment) => {
      setComments((prev) => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      // Also update the counts map so badge shows for everyone
      setCommentCounts((prev) => ({
        ...prev,
        [responseId]: (prev[responseId] || 0) + 1,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [currentResponseIndex, currentPromptIndex, firesideData]);

  // Subscribe to real-time fireside progress updates so dots update live
  useEffect(() => {
    if (!groupId || !firesideData?.week_of) return;

    const weekOf = firesideData.week_of;
    const channel = supabase
      .channel(`fireside-progress:${groupId}:${weekOf}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fireside_progress',
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          const progress = await getFiresideProgress(groupId, weekOf);
          const progressMap: Record<string, 'completed' | 'partial' | 'not_started'> = {};
          for (const p of progress) {
            progressMap[p.user_id] = p.status;
          }
          setFiresideProgress(progressMap);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, firesideData?.week_of]);

  const loadData = async () => {
    if (!groupId) return;

    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setCurrentUserId(userData.user.id);
      }

      // For testing, skip the unlock check
      // In production: if (!isFiresideUnlocked()) { setScreenState("locked"); return; }

      // Finalize the week (idempotent - safe to call multiple times)
      await finalizeWeek(groupId);

      const data = await getFiresideData(groupId);
      if (data) {
        setFiresideData(data);
        setScreenState("intro");
        startFireAnimation();

        // Load comment counts for all responses so badge is visible to everyone
        const allResponseIds: string[] = [];
        for (const prompt of data.prompts) {
          for (const response of prompt.responses || []) {
            if (response.response_id) allResponseIds.push(response.response_id);
          }
        }
        if (allResponseIds.length > 0) {
          const counts = await getCommentCounts(allResponseIds);
          setCommentCounts(counts);
        }

        // Load fireside viewing progress for status dots (green/blue/red)
        if (groupId && data.week_of) {
          const progress = await getFiresideProgress(groupId, data.week_of);
          const progressMap: Record<string, 'completed' | 'partial' | 'not_started'> = {};
          for (const p of progress) {
            progressMap[p.user_id] = p.status;
          }
          setFiresideProgress(progressMap);

          // Record that this user opened the fireside
          updateFiresideProgress(groupId, data.week_of, 0, data.prompts.length);
        }
      } else {
        setScreenState("locked");
      }
    } catch (error) {
      console.error('[Fireside] Failed to load data:', error);
      setScreenState("locked");
    }
  };

  const fetchQuiplashVoterData = async (quiplashData: { matchup_id: string }[]) => {
    const matchupIds = [...new Set(quiplashData.map(p => p.matchup_id))];
    const results = await Promise.all(
      matchupIds.map(id => getQuiplashVoters(id))
    );
    setQuiplashVoters(results.flat());
  };

  const startFireAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnim, {
          toValue: 0.8,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const enterFireside = async () => {
    // Award 5 points for attending fireside (only once per session)
    try {
      if (!hasAwardedFiresidePoints.current) {
        hasAwardedFiresidePoints.current = true;
        await awardPoints('fireside', groupId);
      }
    } catch (error) {
      console.error('[Fireside] Failed to award points:', error);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setScreenState("prompts");
      setCurrentPromptIndex(0);
      setCurrentResponseIndex(-1);
    });
  };

  const currentPrompt = firesideData?.prompts[currentPromptIndex];

  const handleTap = () => {
    if (!currentPrompt) return;

    const responses = currentPrompt.responses || [];
    const isQuizOrMC = ["quiz", "multiple_choice"].includes(currentPrompt.type);
    const isQuiplash = currentPrompt.type === "quiplash";

    // Quiplash: progressive 4-step reveal
    if (isQuiplash) {
      if (revealStep < 3) {
        const nextStep = revealStep + 1;
        setRevealStep(nextStep);
        // Fetch voter data when reaching votes reveal (step 2)
        if (nextStep === 2 && currentPrompt.quiplash_data) {
          fetchQuiplashVoterData(currentPrompt.quiplash_data);
        }
        return;
      }
      goToNextPrompt();
      return;
    }

    // Quiz/MC: tap through reveal steps
    if (isQuizOrMC && currentResponseIndex === -1) {
      if (revealStep < 3) {
        setRevealStep(revealStep + 1);
        return;
      }
    }

    // Showing prompt - move to responses (but NOT for quiz/MC/quiplash)
    if (currentResponseIndex === -1) {
      if (responses.length > 0 && !isQuizOrMC && !isQuiplash) {
        setCurrentResponseIndex(0);
      } else {
        // No responses or quiz/quiplash done, next prompt
        goToNextPrompt();
      }
      return;
    }

    // Showing responses - move to next or next prompt (never for quiplash)
    if (!isQuiplash && currentResponseIndex < responses.length - 1) {
      setCurrentResponseIndex(currentResponseIndex + 1);
    } else {
      goToNextPrompt();
    }
  };

  const goToNextPrompt = () => {
    const totalPrompts = firesideData?.prompts.length || 0;
    if (currentPromptIndex < totalPrompts - 1) {
      const nextIndex = currentPromptIndex + 1;
      setCurrentPromptIndex(nextIndex);
      setCurrentResponseIndex(-1);
      setRevealStep(0);
      setQuiplashVoters([]);
      // Track progress
      if (groupId && firesideData?.week_of) {
        updateFiresideProgress(groupId, firesideData.week_of, nextIndex, totalPrompts);
      }
    } else {
      // Completed the entire fireside
      if (groupId && firesideData?.week_of) {
        updateFiresideProgress(groupId, firesideData.week_of, totalPrompts - 1, totalPrompts, true);
      }
      setScreenState("leaderboard");
    }
  };

  const handleBack = () => {
    if (!currentPrompt) return;

    const responses = currentPrompt.responses || [];
    const isQuizOrMC = ["quiz", "multiple_choice"].includes(currentPrompt.type);
    const isQuiplash = currentPrompt.type === "quiplash";

    // Quiplash: step back through reveal stages
    if (isQuiplash) {
      if (revealStep > 0) {
        setRevealStep(revealStep - 1);
        return;
      }
      // revealStep is 0, go to previous prompt (handled below)
    }

    // If showing responses (not for quiplash), go to previous response or back to prompt
    if (!isQuiplash && currentResponseIndex > 0) {
      setCurrentResponseIndex(currentResponseIndex - 1);
      return;
    }

    // If showing first response (not for quiplash), go back to prompt view
    if (!isQuiplash && currentResponseIndex === 0) {
      setCurrentResponseIndex(-1);
      return;
    }

    // If showing prompt with quiz reveal, step back
    if (isQuizOrMC && revealStep > 0) {
      setRevealStep(revealStep - 1);
      return;
    }

    // Go to previous prompt
    if (currentPromptIndex > 0) {
      const prevPromptIndex = currentPromptIndex - 1;
      const prevPrompt = firesideData?.prompts[prevPromptIndex];
      const prevResponses = prevPrompt?.responses || [];
      const prevIsQuizOrMC = prevPrompt && ["quiz", "multiple_choice"].includes(prevPrompt.type);
      const prevIsQuiplash = prevPrompt?.type === "quiplash";

      setCurrentPromptIndex(prevPromptIndex);
      setComments([]);

      // Go to last response of previous prompt (or prompt itself for quiz/MC/quiplash)
      if (prevIsQuizOrMC) {
        setCurrentResponseIndex(-1);
        setRevealStep(3); // Show fully revealed
      } else if (prevIsQuiplash) {
        setCurrentResponseIndex(-1);
        setRevealStep(3); // Show fully revealed
        // Fetch voter data for previous quiplash prompt
        const prevQuiplashData = firesideData?.prompts[prevPromptIndex]?.quiplash_data;
        if (prevQuiplashData) {
          fetchQuiplashVoterData(prevQuiplashData);
        }
      } else if (prevResponses.length > 0) {
        setCurrentResponseIndex(prevResponses.length - 1);
      } else {
        setCurrentResponseIndex(-1);
      }
    }
  };

  // Loading
  if (screenState === "loading") {
    return (
      <View style={[styles.container, { backgroundColor: "#0B1026" }]}>
        <NightSky density="minimal" showMoon={false} showShootingStars={false} showFireflies={false} showGradient={false} />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  // Pixel lock icon
function PixelLock({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      {/* Lock shackle */}
      <View style={{
        width: size * 0.5,
        height: size * 0.35,
        borderWidth: size * 0.1,
        borderColor: "#A0A0A0",
        borderBottomWidth: 0,
        borderTopLeftRadius: size * 0.25,
        borderTopRightRadius: size * 0.25,
      }} />
      {/* Lock body */}
      <View style={{
        width: size * 0.7,
        height: size * 0.45,
        backgroundColor: "#A0A0A0",
        borderRadius: size * 0.05,
        marginTop: -size * 0.02,
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Keyhole */}
        <View style={{ width: size * 0.12, height: size * 0.12, backgroundColor: "#333", borderRadius: size * 0.06 }} />
        <View style={{ width: size * 0.08, height: size * 0.12, backgroundColor: "#333", marginTop: -size * 0.02 }} />
      </View>
    </View>
  );
}

  // Locked
  if (screenState === "locked") {
    return (
      <View style={[styles.container, { backgroundColor: "#0B1026" }]}>
        <NightSky density="minimal" showMoon={false} showShootingStars showFireflies={false} showGradient={false} />
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "#1a2f1a" }} />
        <View style={{ alignItems: "center", marginTop: 100 }}>
          <PixelLock size={50} />
        </View>
        <Text style={[styles.lockedTitle, { marginTop: 20 }]}>Fireside Locked</Text>
        <Text style={styles.lockedText}>
          The Weekly Fireside unlocks Sunday at 8pm ET
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 8, borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: COLORS.accent, marginRight: 6 }} />
            <Text style={styles.backButtonText}>Back to Group</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Intro animation — avatars walk to campfire
  if (screenState === "intro") {
    return (
      <FiresideIntro
        members={firesideData?.leaderboard || []}
        promptCount={firesideData?.prompts.length || 0}
        onComplete={() => {
          // Award fireside points
          if (!hasAwardedFiresidePoints.current) {
            hasAwardedFiresidePoints.current = true;
            awardPoints('fireside', groupId!);
          }
          setScreenState("prompts");
          setCurrentPromptIndex(0);
          setCurrentResponseIndex(-1);
        }}
      />
    );
  }

  // Bonfire Entry - Stardew Valley style pixel art scene (fallback)
  if (screenState === "bonfire") {
    // Generate trees at various positions
    const trees = [
      { x: -20, height: 120, shade: 0 },
      { x: 30, height: 90, shade: 1 },
      { x: 70, height: 140, shade: 0 },
      { x: 120, height: 100, shade: 2 },
      { x: SCREEN_WIDTH - 150, height: 110, shade: 1 },
      { x: SCREEN_WIDTH - 100, height: 150, shade: 0 },
      { x: SCREEN_WIDTH - 60, height: 95, shade: 2 },
      { x: SCREEN_WIDTH - 20, height: 130, shade: 0 },
    ];

    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: "#0B1026" }]}
        onPress={enterFireside}
        activeOpacity={0.95}
      >
        {/* Shared sky: stars + moon + shooting stars + fireflies */}
        <NightSky density="minimal" showMoon={false} showShootingStars showFireflies showGradient={false} />

        {/* Forest tree line */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200 }}>
          {trees.map((tree, i) => (
            <PixelTree key={i} x={tree.x} height={tree.height} shade={tree.shade} />
          ))}
        </View>

        {/* Ground */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          backgroundColor: "#1a2f1a",
        }} />

        {/* Fire glow on ground */}
        <Animated.View style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          marginLeft: -80,
          width: 160,
          height: 60,
          backgroundColor: "#FF6B35",
          borderRadius: 80,
          opacity: fireAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.25] }),
        }} />

        {/* Campfire area - using DetailedCampfire */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <DetailedCampfire size={120} showSmoke={false} />
        </View>

        {/* Title area */}
        <View style={{ position: "absolute", top: SCREEN_HEIGHT * 0.35, left: 0, right: 0, alignItems: "center" }}>
          <PixelTitle fontSize={30}>Weekly Fireside</PixelTitle>
          <Text style={{
            fontSize: 16,
            color: "#B8A88A",
            marginTop: 12,
            fontWeight: "500",
          }}>
            {firesideData?.prompts.length || 0} moments to relive
          </Text>
          <Text style={{
            fontSize: 14,
            color: "#8B7355",
            marginTop: 30,
            fontStyle: "italic",
          }}>
            tap to gather 'round
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Pixel trophy
function PixelTrophy({ size = 30 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      {/* Cup */}
      <View style={{ width: size * 0.7, height: size * 0.5, backgroundColor: "#FFD700", borderBottomLeftRadius: size * 0.2, borderBottomRightRadius: size * 0.2 }}>
        {/* Handles */}
        <View style={{ position: "absolute", left: -size * 0.15, top: size * 0.08, width: size * 0.15, height: size * 0.25, borderWidth: size * 0.06, borderColor: "#FFD700", borderRightWidth: 0, borderTopLeftRadius: size * 0.1, borderBottomLeftRadius: size * 0.1 }} />
        <View style={{ position: "absolute", right: -size * 0.15, top: size * 0.08, width: size * 0.15, height: size * 0.25, borderWidth: size * 0.06, borderColor: "#FFD700", borderLeftWidth: 0, borderTopRightRadius: size * 0.1, borderBottomRightRadius: size * 0.1 }} />
      </View>
      {/* Stem */}
      <View style={{ width: size * 0.15, height: size * 0.2, backgroundColor: "#FFD700" }} />
      {/* Base */}
      <View style={{ width: size * 0.5, height: size * 0.12, backgroundColor: "#FFD700", borderRadius: size * 0.03 }} />
    </View>
  );
}

// Pixel crown
function PixelCrown({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.7, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View style={{ width: size * 0.15, height: size * 0.4, backgroundColor: "#FFD700" }} />
        <View style={{ width: size * 0.15, height: size * 0.55, backgroundColor: "#FFD700", marginHorizontal: size * 0.05 }} />
        <View style={{ width: size * 0.15, height: size * 0.7, backgroundColor: "#FFD700" }} />
        <View style={{ width: size * 0.15, height: size * 0.55, backgroundColor: "#FFD700", marginHorizontal: size * 0.05 }} />
        <View style={{ width: size * 0.15, height: size * 0.4, backgroundColor: "#FFD700" }} />
      </View>
      <View style={{ width: size, height: size * 0.2, backgroundColor: "#FFD700", marginTop: -size * 0.05 }} />
    </View>
  );
}

// Pixel medal
function PixelMedal({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      {/* Ribbon */}
      <View style={{ width: size * 0.5, height: size * 0.3, backgroundColor: "#DC2626" }} />
      {/* Medal */}
      <View style={{ width: size * 0.7, height: size * 0.7, backgroundColor: color, borderRadius: size * 0.35, marginTop: -size * 0.1 }} />
    </View>
  );
}

// Pixel star (for party/celebration)
function PixelStarIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.4, height: size, backgroundColor: "#FFD93D", position: "absolute" }} />
      <View style={{ width: size, height: size * 0.4, backgroundColor: "#FFD93D", position: "absolute" }} />
      <View style={{ width: size * 0.3, height: size * 0.8, backgroundColor: "#FFD93D", position: "absolute", transform: [{ rotate: "45deg" }] }} />
      <View style={{ width: size * 0.8, height: size * 0.3, backgroundColor: "#FFD93D", position: "absolute", transform: [{ rotate: "45deg" }] }} />
    </View>
  );
}

  // Leaderboard
  if (screenState === "leaderboard") {
    const leaderboard = firesideData?.leaderboard || [];
    const winner = firesideData?.winner;

    return (
      <View style={{ flex: 1, backgroundColor: "#0B1026" }}>
        {/* Stars + shooting star */}
        <NightSky density="minimal" showMoon={false} showShootingStars showFireflies={false} showGradient={false} />

        {/* Ground glow */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 30,
          backgroundColor: "#1a2f1a",
        }} />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.leaderboardContent}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30 }}>
            <PixelTrophy size={36} />
            <Text style={[styles.leaderboardTitle, { marginLeft: 12, marginBottom: 0 }]}>Weekly Champions</Text>
          </View>

        {leaderboard.length === 0 ? (
          <Text style={styles.noDataText}>No points recorded this week</Text>
        ) : (
          leaderboard.map((entry, index) => {
            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;
            const medalColor = isGold ? "#FFD700" : isSilver ? "#C0C0C0" : isBronze ? "#CD7F32" : null;

            return (
              <View
                key={entry.user_id}
                style={[
                  styles.leaderboardRow,
                  isGold && styles.leaderboardGold,
                  isSilver && styles.leaderboardSilver,
                  isBronze && styles.leaderboardBronze,
                ]}
              >
                <View style={styles.leaderboardRankContainer}>
                  {isGold ? (
                    <PixelCrown size={28} />
                  ) : isSilver ? (
                    <PixelMedal color="#C0C0C0" size={24} />
                  ) : isBronze ? (
                    <PixelMedal color="#CD7F32" size={24} />
                  ) : (
                    <Text style={styles.leaderboardRankText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.leaderboardAvatar}>
                  <PixelCharacter
                    config={(entry.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                    size={36}
                  />
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={[
                    styles.leaderboardName,
                    isGold && { color: "#FFD700" },
                    isSilver && { color: "#E8E8E8" },
                    isBronze && { color: "#CD7F32" },
                  ]}>
                    {entry.username || 'Anonymous'}
                  </Text>
                  <Text style={styles.leaderboardBreakdown}>
                    A: {entry.points_answering} | V: {entry.points_voting} | Q: {entry.points_quiplash_wins}
                  </Text>
                </View>
                <Text style={[
                  styles.leaderboardPoints,
                  isGold && { color: "#FFD700" },
                  isSilver && { color: "#E8E8E8" },
                  isBronze && { color: "#CD7F32" },
                ]}>
                  {entry.total_points}
                </Text>
              </View>
            );
          })
        )}

        {winner && (() => {
          const isMVP = currentUserId === winner.user_id;
          const winnerName = winner.username || "The MVP";

          // MVP hasn't chosen yet and current user IS the MVP
          if (isMVP && !winner.has_chosen) {
            return (
              <View style={styles.winnerSection}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <PixelStarIcon size={20} />
                  <Text style={[styles.winnerTitle, { marginHorizontal: 10 }]}>
                    You're the MVP! Pick next week's prompt
                  </Text>
                  <PixelStarIcon size={20} />
                </View>

                {/* Prompt choices */}
                {(winner.prompt_choices || []).map((prompt) => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={styles.promptChoiceCard}
                    onPress={async () => {
                      if (choosingPrompt) return;
                      setChoosingPrompt(true);
                      try {
                        const result = await winnerChoosePrompt(
                          groupId!,
                          firesideData!.week_of,
                          prompt.id
                        );
                        if (result.success && firesideData) {
                          setFiresideData({
                            ...firesideData,
                            winner: { ...winner, has_chosen: true, chosen_prompt_id: prompt.id },
                          });
                        }
                      } catch (error) {
                        console.error('[Fireside] Failed to choose prompt:', error);
                        Alert.alert('Oops', 'Could not submit your choice. Try again!');
                      } finally {
                        setChoosingPrompt(false);
                      }
                    }}
                    disabled={choosingPrompt}
                  >
                    <Text style={styles.promptChoiceType}>{prompt.type.replace("_", " ")}</Text>
                    <Text style={styles.promptChoiceContent}>{prompt.content || prompt.title}</Text>
                  </TouchableOpacity>
                ))}

                {/* Write your own */}
                {!showCustomPrompt ? (
                  <TouchableOpacity
                    style={styles.customPromptButton}
                    onPress={() => setShowCustomPrompt(true)}
                  >
                    <Text style={styles.customPromptButtonText}>Or write your own...</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.customPromptInput}>
                    <TextInput
                      style={styles.customPromptTextInput}
                      placeholder="Write a prompt for next week..."
                      placeholderTextColor={COLORS.muted}
                      value={customPromptText}
                      onChangeText={setCustomPromptText}
                      multiline
                      maxLength={200}
                    />
                    <TouchableOpacity
                      style={[
                        styles.customPromptSubmit,
                        (!customPromptText.trim() || choosingPrompt) && { opacity: 0.5 },
                      ]}
                      onPress={async () => {
                        if (!customPromptText.trim() || choosingPrompt) return;
                        setChoosingPrompt(true);
                        try {
                          const result = await winnerChoosePrompt(
                            groupId!,
                            firesideData!.week_of,
                            undefined,
                            customPromptText.trim(),
                            "short_text"
                          );
                          if (result.success && firesideData) {
                            setFiresideData({
                              ...firesideData,
                              winner: {
                                ...winner,
                                has_chosen: true,
                                custom_prompt_content: customPromptText.trim(),
                              },
                            });
                          }
                        } catch (error) {
                          console.error('[Fireside] Failed to submit custom prompt:', error);
                          Alert.alert('Oops', 'Could not submit your prompt. Try again!');
                        } finally {
                          setChoosingPrompt(false);
                        }
                      }}
                      disabled={!customPromptText.trim() || choosingPrompt}
                    >
                      {choosingPrompt ? (
                        <ActivityIndicator size="small" color={COLORS.text} />
                      ) : (
                        <Text style={styles.customPromptSubmitText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }

          // MVP has already chosen
          if (winner.has_chosen) {
            return (
              <View style={styles.winnerSection}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <PixelStarIcon size={20} />
                  <Text style={[styles.winnerTitle, { marginHorizontal: 10 }]}>
                    {isMVP ? "Your prompt is locked in!" : `${winnerName} picked next week's prompt!`}
                  </Text>
                  <PixelStarIcon size={20} />
                </View>
              </View>
            );
          }

          // Current user is NOT the MVP and MVP hasn't chosen
          return (
            <View style={styles.winnerSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <PixelStarIcon size={20} />
                <Text style={[styles.winnerTitle, { marginHorizontal: 10 }]}>
                  {winnerName} gets to pick next week's prompt!
                </Text>
                <PixelStarIcon size={20} />
              </View>
            </View>
          );
        })()}

        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Prompts View
  if (!currentPrompt) {
    return (
      <View style={styles.container}>
        <Text style={styles.lockedText}>No prompts this week</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const responses = currentPrompt.responses || [];
  const showingPrompt = currentResponseIndex === -1;
  const currentResponse = responses[currentResponseIndex];
  const isQuizOrMC = ["quiz", "multiple_choice"].includes(currentPrompt.type);
  const isQuiplash = currentPrompt.type === "quiplash";

  // Helper to determine media type
  const getMediaType = (promptType: string, mediaUrl?: string): 'photo' | 'video' | 'audio' | null => {
    if (!mediaUrl) return null;

    // First check prompt type
    if (promptType === 'video') return 'video';
    if (promptType === 'voice') return 'audio';
    if (promptType === 'photo') return 'photo';

    // Fallback to extension check (strip query string first)
    const urlPath = mediaUrl.split('?')[0].toLowerCase();
    if (urlPath.match(/\.(mp4|mov|m4v|webm)$/)) return 'video';
    if (urlPath.match(/\.(m4a|mp3|wav|aac|ogg)$/)) return 'audio';
    if (urlPath.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) return 'photo';

    // Default to photo
    return 'photo';
  };

  const mediaType = getMediaType(currentPrompt.type, currentResponse?.media_url);

  // Calculate MC results from responses
  const calculateMcResults = () => {
    if (!isQuizOrMC || responses.length === 0) return null;

    const options = currentPrompt.options || [];
    const totalResponses = responses.length;

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    options.forEach(opt => { voteCounts[opt] = 0; });
    responses.forEach(r => {
      if (r.selected_option && voteCounts[r.selected_option] !== undefined) {
        voteCounts[r.selected_option]++;
      }
    });

    // Find majority
    let majorityOption: string | null = null;
    let majorityCount = 0;
    Object.entries(voteCounts).forEach(([opt, count]) => {
      if (count > majorityCount) {
        majorityCount = count;
        majorityOption = opt;
      }
    });

    // Build results array sorted by vote count
    const results = options.map(option => {
      const count = voteCounts[option] || 0;
      const voter = responses.find(r => r.selected_option === option);
      return {
        option,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        is_correct: option === currentPrompt.correct_answer,
        user_id: voter?.user_id,
        username: voter?.username,
        avatar_config: voter?.avatar_config,
      };
    }).sort((a, b) => b.count - a.count);

    return {
      group_prompt_id: currentPrompt.group_prompt_id,
      prompt_type: currentPrompt.type,
      is_most_likely: currentPrompt.is_most_likely || false,
      total_responses: totalResponses,
      results,
      majority_option: majorityOption,
      majority_count: majorityCount,
      correct_answer: currentPrompt.correct_answer,
    };
  };

  const mcResults = calculateMcResults();

  // Debug: log prompt data
  console.log('[Fireside] prompt:', currentPrompt.type, currentPrompt.content || currentPrompt.title);
  console.log('[Fireside] responses:', currentPrompt.responses?.length, 'responseIdx:', currentResponseIndex);
  if (currentResponseIndex >= 0 && currentPrompt.responses?.[currentResponseIndex]) {
    const r = currentPrompt.responses[currentResponseIndex];
    console.log('[Fireside] current response media_url:', r.media_url, 'content:', typeof r.content === 'string' ? r.content?.substring(0, 50) : JSON.stringify(r.content)?.substring(0, 50));
  }
  if (isQuiplash) {
    console.log('[Quiplash] quiplash_data:', JSON.stringify(currentPrompt.quiplash_data)?.substring(0, 200));
    console.log('[Quiplash] revealStep:', revealStep);
  }

  // Get the response ID for comments - for quiz/MC/quiplash use first response, otherwise current
  const commentResponseId = (isQuizOrMC || isQuiplash) && responses.length > 0
    ? responses[0].response_id
    : currentResponse?.response_id;

  const promptTrees = [
    { x: -15, height: 100, shade: 0 },
    { x: 25, height: 70, shade: 1 },
    { x: SCREEN_WIDTH - 80, height: 90, shade: 1 },
    { x: SCREEN_WIDTH - 30, height: 110, shade: 0 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#0B1026" }]}>
      {/* Starry sky + shooting stars + fireflies */}
      <NightSky density="minimal" showMoon={false} showShootingStars showFireflies showGradient={false} />

      {/* Forest silhouettes */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 150, zIndex: 1 }}>
        {promptTrees.map((tree, i) => (
          <PixelTree key={i} x={tree.x} height={tree.height} shade={tree.shade} />
        ))}
      </View>

      {/* Ground with fire glow */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: "#1a2f1a",
        zIndex: 2,
      }} />
      <Animated.View style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        marginLeft: -100,
        width: 200,
        height: 40,
        backgroundColor: "#FF6B35",
        borderRadius: 100,
        opacity: fireAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.2] }),
        zIndex: 1,
      }} />

      {/* Small campfire at bottom */}
      <View style={{ position: "absolute", bottom: 15, left: "50%", marginLeft: -30, zIndex: 3 }}>
        <DetailedCampfire size={60} showSmoke={false} />
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={COLORS.text} />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentPromptIndex + 1) / (firesideData?.prompts.length || 1)) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentPromptIndex + 1} / {firesideData?.prompts.length}
        </Text>
      </View>

      {/* Back button - mid left */}
      <TouchableOpacity
        onPress={handleBack}
        style={styles.midNavButtonLeft}
        disabled={currentPromptIndex === 0 && currentResponseIndex === -1 && revealStep === 0}
      >
        <Ionicons
          name="chevron-back"
          size={32}
          color={currentPromptIndex === 0 && currentResponseIndex === -1 && revealStep === 0
            ? COLORS.border
            : COLORS.text}
        />
      </TouchableOpacity>

      {/* Forward button - mid right */}
      <TouchableOpacity onPress={handleTap} style={styles.midNavButtonRight}>
        <Ionicons name="chevron-forward" size={32} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.promptContainer}>
        {/* Prompt type badge - only show for Quiplash */}
        {showingPrompt && isQuiplash && (
          <View style={[styles.typeBadge, styles.quiplashBadge]}>
            <Text style={styles.typeBadgeText}>Mano e Mano</Text>
          </View>
        )}

        {showingPrompt ? (
          // Show the prompt
          <View style={styles.promptContent}>
            {/* Navigation hint at top */}
            <Text style={styles.swipeHintTop}>
              {isQuizOrMC && revealStep < 3
                ? "→ reveal"
                : isQuiplash
                ? revealStep === 0
                  ? "→ see answers"
                  : revealStep === 1
                  ? "→ reveal votes"
                  : revealStep === 2
                  ? "→ see who wrote them"
                  : "→ next"
                : responses.length > 0 && !isQuizOrMC
                ? "→ see responses"
                : "→ next"}
            </Text>
            <AutoShrinkText style={styles.promptTitle} text={currentPrompt.content || currentPrompt.title || ''} />

            {/* Member fireside progress dots - green=completed, blue=started, red=not opened */}
            {firesideData?.leaderboard && firesideData.leaderboard.length > 0 && Object.keys(firesideProgress).length > 0 && (
              <View style={styles.statusDotsRow}>
                {firesideData.leaderboard.map((member) => {
                  const status = firesideProgress[member.user_id] || 'not_started';
                  const dotColor = status === 'completed' ? '#4ADE80'
                    : status === 'partial' ? '#60A5FA'
                    : '#EF4444';
                  return (
                    <View key={member.user_id} style={styles.statusDotMember}>
                      <PixelCharacter
                        config={(member.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                        size={20}
                      />
                      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    </View>
                  );
                })}
              </View>
            )}

            {isQuizOrMC && revealStep >= 1 && (
              <View style={styles.optionsContainer}>
                {/* Show enhanced results component when fully revealed */}
                {revealStep >= 3 && mcResults ? (
                  <MultipleChoiceResults
                    results={mcResults}
                    showCorrectAnswer={currentPrompt.type === 'quiz'}
                    voters={responses.map(r => ({
                      user_id: r.user_id,
                      username: r.username,
                      avatar_config: r.avatar_config,
                      selected_option: r.selected_option || '',
                    }))}
                  />
                ) : (
                  /* Show progressive reveal before final step */
                  (currentPrompt.options || []).map((option, i) => {
                    const votersForOption = responses.filter(r => r.selected_option === option);
                    const isCorrect = option === currentPrompt.correct_answer;

                    return (
                      <View
                        key={i}
                        style={[
                          styles.optionRow,
                          revealStep >= 3 && isCorrect && styles.optionCorrect,
                          revealStep >= 3 && !isCorrect && styles.optionWrong,
                        ]}
                      >
                        <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                        <Text style={[styles.optionText, revealStep >= 3 && isCorrect && styles.optionTextCorrect]}>
                          {option}
                        </Text>
                        {revealStep >= 2 && votersForOption.length > 0 && (
                          <View style={styles.voterBadges}>
                            {votersForOption.slice(0, 4).map((v, vi) => (
                              <View
                                key={vi}
                                style={[
                                  styles.voterAvatarSmall,
                                  { marginLeft: vi > 0 ? -6 : 0, zIndex: 10 - vi },
                                ]}
                              >
                                <PixelCharacter
                                  config={(v.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                                  size={18}
                                />
                              </View>
                            ))}
                            {votersForOption.length > 4 && (
                              <View style={styles.moreVotersSmall}>
                                <Text style={styles.moreVotersTextSmall}>+{votersForOption.length - 4}</Text>
                              </View>
                            )}
                          </View>
                        )}
                        {revealStep >= 3 && isCorrect && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {isQuiplash && currentPrompt.quiplash_data && revealStep >= 1 && (
              <View style={styles.quiplashResults}>
                {currentPrompt.quiplash_data.map((participant, i) => {
                  const maxVotes = Math.max(...(currentPrompt.quiplash_data?.map(p => p.votes) || [0]));
                  const isWinner = participant.votes === maxVotes && maxVotes > 0;
                  const isTie = currentPrompt.quiplash_data?.filter(p => p.votes === maxVotes).length === 2;

                  // Get voters for this participant's response
                  const votersForThis = quiplashVoters.filter(
                    v => v.voted_for_response_id === participant.response?.id
                  );

                  return (
                    <View
                      key={i}
                      style={[
                        styles.quiplashEntry,
                        revealStep >= 2 && isWinner && !isTie && styles.quiplashWinner,
                      ]}
                    >
                      {/* Answer content */}
                      <Text style={styles.quiplashAnswer}>
                        "{participant.response?.content || "(no answer)"}"
                      </Text>

                      {/* Step 2+: Votes + voter avatars */}
                      {revealStep >= 2 && (
                        <View style={styles.quiplashMeta}>
                          <Text style={[styles.quiplashVotes, isWinner && !isTie && styles.quiplashVotesWinner]}>
                            {isWinner && !isTie ? "WINNER " : ""}{participant.votes} vote{participant.votes !== 1 ? 's' : ''}
                          </Text>
                          {votersForThis.length > 0 && (
                            <View style={styles.quiplashVoterRow}>
                              {votersForThis.map((voter, vi) => (
                                <View
                                  key={vi}
                                  style={[
                                    styles.voterAvatarSmall,
                                    { marginLeft: vi > 0 ? -6 : 0, zIndex: 10 - vi },
                                  ]}
                                >
                                  <PixelCharacter
                                    config={(voter.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                                    size={18}
                                  />
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Step 3: Author reveal */}
                      {revealStep >= 3 && (
                        <View style={styles.quiplashAuthorReveal}>
                          <Text style={styles.quiplashWrittenBy}>written by</Text>
                          <View style={styles.quiplashAuthorRow}>
                            <View style={styles.quiplashAuthorAvatar}>
                              <PixelCharacter
                                config={(participant.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                                size={20}
                              />
                            </View>
                            <Text style={styles.quiplashName}>
                              {participant.username || 'Anonymous'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Points banner - step 3 */}
                {revealStep >= 3 && (() => {
                  const maxVotes = Math.max(...(currentPrompt.quiplash_data?.map(p => p.votes) || [0]));
                  const winners = currentPrompt.quiplash_data?.filter(p => p.votes === maxVotes && maxVotes > 0) || [];
                  if (winners.length === 1) {
                    return (
                      <View style={styles.quiplashPointsBanner}>
                        <Text style={styles.quiplashPointsText}>
                          {winners[0].username || 'Anonymous'} earns 5 points!
                        </Text>
                      </View>
                    );
                  }
                  if (winners.length === 2) {
                    return (
                      <View style={styles.quiplashPointsBanner}>
                        <Text style={styles.quiplashTie}>It's a tie!</Text>
                        <Text style={styles.quiplashPointsText}>
                          {winners[0].username || 'Anonymous'} & {winners[1].username || 'Anonymous'} each earn 2.5 points
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            )}
          </View>
        ) : !isQuiplash ? (
          // Regular response view (never shown for quiplash)
          <View style={styles.responseContainer}>
            {/* Photo author - top left, OUTSIDE the photo */}
            {mediaType === 'photo' && (
              <View style={styles.photoAuthorRow}>
                <View style={styles.photoAuthorAvatar}>
                  <PixelCharacter
                    config={(currentResponse?.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                    size={36}
                  />
                </View>
                <Text style={styles.photoAuthorName}>
                  {currentResponse?.username || 'Anonymous'}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={24} color={COLORS.muted} />
              </View>
            )}

            {/* Media content */}
            {mediaType === 'video' && (
              signedPhotoUrl ? (
                <View style={styles.responseVideo}>
                  <VideoPlayer uri={signedPhotoUrl} />
                </View>
              ) : (
                <View style={[styles.responsePhoto, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card }]}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>Loading video...</Text>
                </View>
              )
            )}

            {mediaType === 'audio' && (
              signedPhotoUrl ? (
                <View style={styles.responseAudio}>
                  <AudioPlayer uri={signedPhotoUrl} />
                </View>
              ) : (
                <View style={[styles.responseAudio, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, padding: 20, borderRadius: 16 }]}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>Loading audio...</Text>
                </View>
              )
            )}

            {mediaType === 'photo' && signedPhotoUrl && (
              <View style={styles.responsePhoto}>
                <Image
                  source={{ uri: signedPhotoUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
                  resizeMode="cover"
                  onError={(e) => {
                    console.log('[Image] Load error:', e.nativeEvent.error);
                    console.log('[Image] Failed URL:', signedPhotoUrl);
                  }}
                  onLoad={() => console.log('[Image] Loaded successfully!')}
                  onLoadStart={() => console.log('[Image] Starting to load...')}
                />
              </View>
            )}

            {mediaType === 'photo' && !signedPhotoUrl && (
              <View style={[styles.responsePhoto, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>Loading photo...</Text>
              </View>
            )}

            {/* Only show content if it exists */}
            {currentResponse?.content ? (
              <AutoShrinkText style={styles.responseContent} text={currentResponse.content} />
            ) : null}

            {/* Author with avatar - below text (not shown for photos, handled above) */}
            {mediaType !== 'photo' && (
              <View style={styles.responseAuthorColumn}>
                <View style={styles.responseAuthorAvatarLarge}>
                  <PixelCharacter
                    config={(currentResponse?.avatar_config as unknown as CharacterConfig) || DEFAULT_CHARACTER}
                    size={40}
                  />
                </View>
                <Text style={styles.responseAuthorName}>
                  {currentResponse?.username || 'Anonymous'}
                </Text>
              </View>
            )}

            <Text style={styles.responseCount}>
              {currentResponseIndex + 1} of {responses.length}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Floating emoji reactions - shown on all responses including quiplash */}
      {commentResponseId && (
        <View style={styles.reactionsContainer}>
          <FiresideReactions
            responseId={commentResponseId}
            promptId={currentPrompt.prompt_id}
          />
        </View>
      )}

      {/* Comments button - TikTok/Reels style */}
      {commentResponseId && (
        <TouchableOpacity
          style={styles.commentsButton}
          onPress={() => setShowCommentSheet(true)}
          activeOpacity={0.7}
        >
          <View style={styles.commentsButtonInner}>
            <Ionicons name="chatbubble" size={22} color={COLORS.text} />
            {(() => {
              const count = comments.length > 0 ? comments.length : (commentCounts[commentResponseId] || 0);
              return count > 0 ? (
                <View style={styles.commentBadge}>
                  <Text style={styles.commentBadgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              ) : null;
            })()}
          </View>
          <Text style={styles.commentsButtonText}>Comments</Text>
        </TouchableOpacity>
      )}

      {/* Comment sheet modal */}
      {commentResponseId && (
        <CommentSheet
          visible={showCommentSheet}
          responseId={commentResponseId}
          onClose={() => setShowCommentSheet(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Locked screen
  lockedTitle: {
    fontSize: 32,
    fontFamily: "Paaxel",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 20,
  },
  lockedText: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 40,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    marginTop: 40,
    alignSelf: "center",
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontFamily: "Paaxel",
  },
  // Bonfire
  bonfireContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bonfire: {
    alignItems: "center",
  },
  bonfireEmoji: {
    fontSize: 100,
  },
  logEmoji: {
    fontSize: 60,
    marginTop: -20,
  },
  firesideTitle: {
    fontSize: 40,
    fontFamily: "Paaxel",
    color: COLORS.accent,
    marginTop: 40,
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  firesideSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 8,
  },
  firesideTapText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 40,
    opacity: 0.6,
  },
  ember: {
    position: "absolute",
  },
  ember1: {
    top: "35%",
    left: "40%",
  },
  ember2: {
    top: "38%",
    right: "35%",
  },
  emberText: {
    fontSize: 20,
  },
  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.muted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  navButton: {
    padding: 8,
  },
  midNavButtonLeft: {
    position: "absolute",
    left: 4,
    top: "50%",
    zIndex: 50,
    padding: 8,
    backgroundColor: COLORS.card + "99",
    borderRadius: 20,
  },
  midNavButtonRight: {
    position: "absolute",
    right: 4,
    top: "50%",
    zIndex: 50,
    padding: 8,
    backgroundColor: COLORS.card + "99",
    borderRadius: 20,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 100,
    padding: 8,
    backgroundColor: COLORS.card + "CC",
    borderRadius: 20,
  },
  // Prompt container
  promptContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    paddingTop: "15%",
    paddingBottom: 180,
  },
  typeBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "center",
    marginBottom: 24,
  },
  quiplashBadge: {
    backgroundColor: COLORS.purple + "30",
    borderWidth: 1,
    borderColor: COLORS.purple,
  },
  typeBadgeText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "Paaxel",
    textTransform: "capitalize",
  },
  promptContent: {
    alignItems: "center",
    paddingBottom: 40,
  },
  promptTitle: {
    fontSize: 28,
    fontFamily: "Paaxel",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 38,
    paddingHorizontal: 10,
  },
  statusDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    flexWrap: "wrap",
  },
  statusDotMember: {
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#0B1026",
  },
  swipeHint: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 40,
    textAlign: "center",
    opacity: 0.6,
  },
  swipeHintTop: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    opacity: 0.6,
  },
  // Options (Quiz/MC)
  optionsContainer: {
    marginTop: 30,
    width: "100%",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: COLORS.green + "30",
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  optionWrong: {
    opacity: 0.4,
  },
  optionLetter: {
    color: COLORS.accent,
    fontSize: 18,
    fontFamily: "Paaxel",
    marginRight: 12,
    width: 24,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
  optionTextCorrect: {
    color: COLORS.green,
    fontFamily: "Paaxel",
  },
  voterBadges: {
    flexDirection: "row",
    marginLeft: 8,
    alignItems: "center",
  },
  voterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B35",
    marginLeft: 2,
  },
  voterAvatarSmall: {
    width: 22,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreVotersSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
    zIndex: 1,
  },
  moreVotersTextSmall: {
    color: COLORS.text,
    fontSize: 8,
    fontFamily: "Paaxel",
  },
  checkMark: {
    color: COLORS.green,
    fontSize: 20,
    fontFamily: "Paaxel",
    marginLeft: 8,
  },
  // Quiplash
  quiplashResults: {
    marginTop: 16,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  quiplashEntry: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    flex: 1,
    minWidth: "45%",
    maxWidth: "48%",
  },
  quiplashWinner: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + "10",
  },
  quiplashAnswer: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Paaxel",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
  },
  quiplashMeta: {
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  quiplashVotes: {
    color: COLORS.muted,
    fontSize: 14,
    fontFamily: "Paaxel",
  },
  quiplashVotesWinner: {
    color: COLORS.gold,
  },
  quiplashName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  quiplashAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quiplashAuthorAvatar: {
    width: 24,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  quiplashHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.7,
  },
  quiplashLabel: {
    color: COLORS.purple,
    fontSize: 20,
    fontFamily: "Paaxel",
    textAlign: "center",
    marginBottom: 8,
  },
  quiplashVoterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  quiplashAuthorReveal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
    gap: 4,
  },
  quiplashWrittenBy: {
    color: COLORS.muted,
    fontSize: 12,
    fontStyle: "italic",
  },
  quiplashPointsBanner: {
    marginTop: 6,
    width: "100%",
    backgroundColor: COLORS.gold + "20",
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  quiplashPointsText: {
    color: COLORS.gold,
    fontSize: 16,
    fontFamily: "Paaxel",
    textAlign: "center",
  },
  quiplashTie: {
    color: COLORS.gold,
    fontSize: 18,
    fontFamily: "Paaxel",
    textAlign: "center",
    marginBottom: 4,
  },
  // Response view
  responseContainer: {
    alignItems: "center",
    paddingBottom: 180,
  },
  responsePhoto: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#1a1a2e', // Dark background so we can see if image loads
  },
  responseVideo: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 40,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  responseAudio: {
    width: SCREEN_WIDTH - 80,
    marginBottom: 20,
  },
  responseContent: {
    fontSize: 22,
    fontFamily: "Paaxel",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 20,
    marginTop: 20,
    fontStyle: "italic",
  },
  responseAuthor: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 20,
  },
  responseAuthorColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 4,
  },
  responseAuthorAvatarLarge: {
    width: 48,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  photoAuthorAvatar: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  photoAuthorName: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Paaxel",
  },
  responseAuthorName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Paaxel",
  },
  responseCount: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  // Reactions container - fixed at bottom center
  reactionsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  // Comments button - positioned at bottom right
  commentsButton: {
    position: "absolute",
    right: 16,
    bottom: 70,
    alignItems: "center",
    zIndex: 100,
  },
  commentsButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  commentBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 10,
  },
  commentBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Paaxel",
  },
  commentsButtonText: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  // Leaderboard
  leaderboardContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  leaderboardTitle: {
    fontSize: 32,
    fontFamily: "Paaxel",
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 30,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  leaderboardGold: {
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  leaderboardSilver: {
    borderWidth: 2,
    borderColor: "#C0C0C0",
    backgroundColor: "rgba(192, 192, 192, 0.1)",
  },
  leaderboardBronze: {
    borderWidth: 2,
    borderColor: "#CD7F32",
    backgroundColor: "rgba(205, 127, 50, 0.1)",
  },
  leaderboardRankContainer: {
    width: 36,
    height: 36,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardRankText: {
    fontSize: 18,
    fontFamily: "Paaxel",
    color: COLORS.muted,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Paaxel",
  },
  leaderboardBreakdown: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  leaderboardPoints: {
    color: COLORS.gold,
    fontSize: 28,
    fontFamily: "Paaxel",
  },
  winnerSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: COLORS.purple + "20",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.purple,
  },
  winnerTitle: {
    color: COLORS.purple,
    fontSize: 16,
    fontFamily: "Paaxel",
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: COLORS.accent,
    padding: 18,
    borderRadius: 16,
    marginTop: 30,
    alignItems: "center",
  },
  doneButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: "Paaxel",
  },
  promptChoiceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.purple + "40",
  },
  promptChoiceType: {
    color: COLORS.purple,
    fontSize: 11,
    fontFamily: "Paaxel",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  promptChoiceContent: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  customPromptButton: {
    marginTop: 8,
    padding: 14,
    alignItems: "center",
  },
  customPromptButtonText: {
    color: COLORS.purple,
    fontSize: 14,
    fontFamily: "Paaxel",
    fontStyle: "italic",
  },
  customPromptInput: {
    marginTop: 8,
  },
  customPromptTextInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.purple + "40",
  },
  customPromptSubmit: {
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  customPromptSubmitText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: "Paaxel",
  },
});
