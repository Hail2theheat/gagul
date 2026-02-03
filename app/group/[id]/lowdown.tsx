// app/group/[id]/lowdown.tsx
import { useGlobalSearchParams, router } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import {
  getFiresideData,
  isFiresideUnlocked,
  addComment,
  getComments,
  subscribeToComments,
  getSignedImageUrl,
  FiresideData,
  FiresidePrompt,
  FiresideComment,
} from "../../../lib/services/firesideService";
import { MultipleChoiceResults } from "../../../components/prompts/MultipleChoiceResults";
import { ReactionBar } from "../../../components/prompts/ReactionBar";
import { CommentSheet } from "../../../components/prompts/CommentSheet";
import { AudioPlayer } from "../../../components/prompts/AudioPlayer";
import { VideoPlayer } from "../../../components/prompts/VideoPlayer";
import { trackViewStart, trackViewEnd } from "../../../lib/services/metricsService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Pixel art star that twinkles
function PixelStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(twinkle, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    };
    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: "#FFF",
        opacity: twinkle,
        shadowColor: "#FFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size,
      }}
    />
  );
}

// Shooting star animation
function ShootingStar({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const startY = useRef(30 + Math.random() * 100).current;
  const startX = useRef(Math.random() * SCREEN_WIDTH * 0.6).current;

  useEffect(() => {
    const animate = () => {
      setVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        // Repeat after random interval
        setTimeout(animate, 5000 + Math.random() * 10000);
      });
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        top: startY,
        width: 3,
        height: 3,
        backgroundColor: "#FFF",
        borderRadius: 1.5,
        opacity: progress.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 180] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) },
        ],
        shadowColor: "#FFF",
        shadowOffset: { width: -10, height: -5 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
      }}
    />
  );
}

// Pixel art pine tree
function PixelTree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const treeColor = `rgba(15, ${30 + shade * 15}, ${20 + shade * 10}, 1)`;
  const trunkColor = `rgba(40, ${25 + shade * 5}, 15, 1)`;

  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      {/* Tree layers - pixel art style triangles using Views */}
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.4, borderRightWidth: height * 0.4, borderBottomWidth: height * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor, marginBottom: -8 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.5, borderRightWidth: height * 0.5, borderBottomWidth: height * 0.4, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor, marginBottom: -10 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.6, borderRightWidth: height * 0.6, borderBottomWidth: height * 0.45, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: treeColor }} />
      {/* Trunk */}
      <View style={{ width: height * 0.15, height: height * 0.2, backgroundColor: trunkColor }} />
    </View>
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
        <Text style={{ color: "#FFF8DC", fontSize: 13, fontWeight: "600" }}>{comment.content}</Text>
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

type ScreenState = "loading" | "locked" | "bonfire" | "prompts" | "leaderboard";

export default function LowdownScreen() {
  const params = useGlobalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : undefined;

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [firesideData, setFiresideData] = useState<FiresideData | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(-1); // -1 = show prompt
  const [revealStep, setRevealStep] = useState(0); // For quiz/MC reveals
  const [comments, setComments] = useState<FiresideComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const viewStartTime = useRef<number | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fireAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [groupId]);

  // Fetch signed URL when showing a photo response
  useEffect(() => {
    const fetchSignedUrl = async () => {
      const prompt = firesideData?.prompts[currentPromptIndex];
      if (currentResponseIndex >= 0 && prompt) {
        const response = prompt.responses?.[currentResponseIndex];
        if (response?.media_url) {
          setSignedPhotoUrl(null);
          const signedUrl = await getSignedImageUrl(response.media_url);
          setSignedPhotoUrl(signedUrl);
        } else {
          setSignedPhotoUrl(null);
        }
      } else {
        setSignedPhotoUrl(null);
      }
    };
    fetchSignedUrl();
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

    // For quiz/MC, use first response as anchor; for others, use current response
    let response;
    if (isQuizOrMCPrompt && promptResponses.length > 0) {
      response = promptResponses[0]; // Use first response for quiz/MC
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
    });

    return () => {
      unsubscribe();
    };
  }, [currentResponseIndex, currentPromptIndex, firesideData]);


  const loadData = async () => {
    if (!groupId) return;

    // For testing, skip the unlock check
    // In production: if (!isFiresideUnlocked()) { setScreenState("locked"); return; }

    const data = await getFiresideData(groupId);
    if (data) {
      setFiresideData(data);
      setScreenState("bonfire");
      startFireAnimation();
    } else {
      setScreenState("locked");
    }
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

  const enterFireside = () => {
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

    // Quiz/MC: tap through reveal steps
    if (isQuizOrMC && currentResponseIndex === -1) {
      if (revealStep < 3) {
        setRevealStep(revealStep + 1);
        return;
      }
    }

    // Showing prompt - move to responses
    if (currentResponseIndex === -1) {
      if (responses.length > 0 && !isQuizOrMC) {
        setCurrentResponseIndex(0);
      } else {
        // No responses or quiz done, next prompt
        goToNextPrompt();
      }
      return;
    }

    // Showing responses - move to next or next prompt
    if (currentResponseIndex < responses.length - 1) {
      setCurrentResponseIndex(currentResponseIndex + 1);
    } else {
      goToNextPrompt();
    }
  };

  const goToNextPrompt = () => {
    if (currentPromptIndex < (firesideData?.prompts.length || 0) - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
      setCurrentResponseIndex(-1);
      setRevealStep(0);
      // Comments will be loaded by useEffect when response changes
    } else {
      setScreenState("leaderboard");
    }
  };

  const handleBack = () => {
    if (!currentPrompt) return;

    const responses = currentPrompt.responses || [];
    const isQuizOrMC = ["quiz", "multiple_choice"].includes(currentPrompt.type);

    // If showing responses, go to previous response or back to prompt
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(currentResponseIndex - 1);
      return;
    }

    // If showing first response, go back to prompt view
    if (currentResponseIndex === 0) {
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

      setCurrentPromptIndex(prevPromptIndex);
      setComments([]);

      // Go to last response of previous prompt (or prompt itself for quiz/MC)
      if (prevIsQuizOrMC) {
        setCurrentResponseIndex(-1);
        setRevealStep(3); // Show fully revealed
      } else if (prevResponses.length > 0) {
        setCurrentResponseIndex(prevResponses.length - 1);
      } else {
        setCurrentResponseIndex(-1);
      }
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentPrompt) return;

    const responses = currentPrompt.responses || [];
    const isQuizOrMCPrompt = ["quiz", "multiple_choice"].includes(currentPrompt.type);

    // For quiz/MC, use first response; for others, use current response
    const response = isQuizOrMCPrompt ? responses[0] : responses[Math.max(0, currentResponseIndex)];
    if (!response?.response_id) return;

    const text = commentText.trim();
    setCommentText(""); // Clear immediately for UX

    const comment = await addComment(response.response_id, text);
    if (!comment) {
      setCommentText(text); // Restore on failure
    }
    // Real-time subscription will add the comment to state
  };

  // Stars for locked/loading screens
  const lockedStars = [
    { x: 40, y: 80, size: 2, delay: 0 },
    { x: 120, y: 50, size: 3, delay: 300 },
    { x: 200, y: 100, size: 2, delay: 150 },
    { x: 280, y: 60, size: 2, delay: 450 },
    { x: 60, y: 150, size: 3, delay: 200 },
    { x: 320, y: 120, size: 2, delay: 500 },
  ];

  // Loading
  if (screenState === "loading") {
    return (
      <View style={[styles.container, { backgroundColor: "#0B1026" }]}>
        {lockedStars.map((star, i) => (
          <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
        ))}
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
        {lockedStars.map((star, i) => (
          <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
        ))}
        <ShootingStar delay={2000} />
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "#1a2f1a" }} />
        <View style={{ alignItems: "center", marginTop: 100 }}>
          <PixelLock size={50} />
        </View>
        <Text style={[styles.lockedTitle, { marginTop: 20 }]}>Fireside Locked</Text>
        <Text style={styles.lockedText}>
          The Weekly Fireside unlocks Sunday at 9pm ET
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

  // Bonfire Entry - Stardew Valley style pixel art scene
  if (screenState === "bonfire") {
    // Generate stars at fixed positions
    const stars = [
      { x: 20, y: 40, size: 2, delay: 0 },
      { x: 80, y: 70, size: 3, delay: 200 },
      { x: 150, y: 30, size: 2, delay: 400 },
      { x: 200, y: 90, size: 2, delay: 100 },
      { x: 260, y: 50, size: 3, delay: 300 },
      { x: 320, y: 80, size: 2, delay: 500 },
      { x: 50, y: 120, size: 2, delay: 600 },
      { x: 120, y: 150, size: 3, delay: 150 },
      { x: 180, y: 100, size: 2, delay: 250 },
      { x: 240, y: 140, size: 2, delay: 350 },
      { x: 300, y: 110, size: 3, delay: 450 },
      { x: 350, y: 60, size: 2, delay: 550 },
      { x: 40, y: 180, size: 2, delay: 700 },
      { x: 100, y: 200, size: 2, delay: 50 },
      { x: 280, y: 170, size: 3, delay: 650 },
      { x: 340, y: 130, size: 2, delay: 750 },
      { x: 70, y: 250, size: 2, delay: 800 },
      { x: 220, y: 220, size: 2, delay: 850 },
    ];

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
        {/* Gradient sky overlay */}
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.7,
          backgroundColor: "transparent",
          opacity: 0.8,
        }}>
          <View style={{ flex: 1, backgroundColor: "#0B1026" }} />
          <View style={{ flex: 1, backgroundColor: "#1a1a3e" }} />
          <View style={{ flex: 1, backgroundColor: "#2d1f4e" }} />
        </View>

        {/* Stars */}
        {stars.map((star, i) => (
          <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
        ))}

        {/* Shooting stars */}
        <ShootingStar delay={2000} />
        <ShootingStar delay={8000} />
        <ShootingStar delay={15000} />

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

        {/* Campfire area */}
        <View style={{ position: "absolute", bottom: 50, left: 0, right: 0, alignItems: "center" }}>
          {/* Logs */}
          <View style={{ flexDirection: "row", marginTop: 60 }}>
            <View style={{ width: 60, height: 14, backgroundColor: "#4a3728", borderRadius: 7, transform: [{ rotate: "-20deg" }], marginRight: -15 }} />
            <View style={{ width: 60, height: 14, backgroundColor: "#3d2d20", borderRadius: 7, transform: [{ rotate: "20deg" }], marginLeft: -15 }} />
          </View>

          {/* Fire */}
          <View style={{ position: "absolute", bottom: 20 }}>
            <PixelFlame scale={fireAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })} flicker={fireAnim} />
          </View>

          {/* Embers */}
          <Ember delay={0} side="left" />
          <Ember delay={500} side="right" />
          <Ember delay={1000} side="center" />
          <Ember delay={1500} side="left" />
          <Ember delay={2000} side="right" />
        </View>

        {/* Title area */}
        <View style={{ position: "absolute", top: SCREEN_HEIGHT * 0.35, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{
            fontSize: 36,
            fontWeight: "900",
            color: "#FFE4B5",
            textShadowColor: "#FF6B35",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
            letterSpacing: 2,
          }}>
            Weekly Fireside
          </Text>
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

    const leaderboardStars = [
      { x: 30, y: 40, size: 2, delay: 0 },
      { x: 100, y: 70, size: 3, delay: 200 },
      { x: 180, y: 30, size: 2, delay: 400 },
      { x: 250, y: 90, size: 2, delay: 100 },
      { x: 320, y: 50, size: 3, delay: 300 },
      { x: 60, y: 120, size: 2, delay: 500 },
      { x: 280, y: 110, size: 2, delay: 350 },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: "#0B1026" }}>
        {/* Stars */}
        {leaderboardStars.map((star, i) => (
          <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
        ))}
        <ShootingStar delay={4000} />

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
          leaderboard.map((entry, index) => (
            <View
              key={entry.user_id}
              style={[
                styles.leaderboardRow,
                index === 0 && styles.leaderboardWinner,
              ]}
            >
              <View style={styles.leaderboardRankContainer}>
                {index === 0 ? <PixelCrown size={28} /> : index === 1 ? <PixelMedal color="#C0C0C0" size={24} /> : index === 2 ? <PixelMedal color="#CD7F32" size={24} /> : <Text style={styles.leaderboardRankText}>{index + 1}</Text>}
              </View>
              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName}>
                  Player {entry.user_id.slice(0, 6)}
                </Text>
                <Text style={styles.leaderboardBreakdown}>
                  A: {entry.points_answering} | V: {entry.points_voting} | Q: {entry.points_quiplash_wins}
                </Text>
              </View>
              <Text style={styles.leaderboardPoints}>{entry.total_points}</Text>
            </View>
          ))
        )}

        {winner && !winner.has_chosen && (
          <View style={styles.winnerSection}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <PixelStarIcon size={20} />
              <Text style={[styles.winnerTitle, { marginHorizontal: 10 }]}>
                Winner gets to choose next week's prompt!
              </Text>
              <PixelStarIcon size={20} />
            </View>
          </View>
        )}

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

  // Stars for prompts view
  const promptStars = [
    { x: 20, y: 60, size: 2, delay: 0 },
    { x: 80, y: 90, size: 2, delay: 200 },
    { x: 150, y: 50, size: 3, delay: 400 },
    { x: 200, y: 110, size: 2, delay: 100 },
    { x: 260, y: 70, size: 2, delay: 300 },
    { x: 320, y: 100, size: 3, delay: 500 },
    { x: 50, y: 140, size: 2, delay: 600 },
    { x: 120, y: 170, size: 2, delay: 150 },
    { x: 280, y: 130, size: 2, delay: 350 },
    { x: 340, y: 80, size: 2, delay: 450 },
  ];

  const promptTrees = [
    { x: -15, height: 100, shade: 0 },
    { x: 25, height: 70, shade: 1 },
    { x: SCREEN_WIDTH - 80, height: 90, shade: 1 },
    { x: SCREEN_WIDTH - 30, height: 110, shade: 0 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#0B1026" }]}>
      {/* Starry sky background */}
      {promptStars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
      ))}

      {/* Shooting stars */}
      <ShootingStar delay={3000} />
      <ShootingStar delay={12000} />

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
      <View style={{ position: "absolute", bottom: 25, left: "50%", marginLeft: -20, zIndex: 3 }}>
        <Animated.View style={{
          transform: [{ scale: fireAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
        }}>
          <View style={{ width: 40, height: 50, alignItems: "center" }}>
            <View style={{ width: 30, height: 40, backgroundColor: "#FF4500", borderRadius: 15, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
              <View style={{ position: "absolute", bottom: 0, left: 5, width: 20, height: 30, backgroundColor: "#FF6B35", borderRadius: 10 }}>
                <View style={{ position: "absolute", bottom: 0, left: 4, width: 12, height: 18, backgroundColor: "#FFD93D", borderRadius: 6 }} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={COLORS.text} />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {/* Back button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.navButton}
          disabled={currentPromptIndex === 0 && currentResponseIndex === -1 && revealStep === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentPromptIndex === 0 && currentResponseIndex === -1 && revealStep === 0
              ? COLORS.border
              : COLORS.text}
          />
        </TouchableOpacity>

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

        {/* Forward button */}
        <TouchableOpacity onPress={handleTap} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.promptContainer} onPress={handleTap} activeOpacity={0.9}>
        {/* Prompt type badge */}
        <View style={[styles.typeBadge, isQuiplash && styles.quiplashBadge]}>
          <Text style={styles.typeBadgeText}>
            {isQuiplash ? "Mano e Mano" : currentPrompt.type.replace("_", " ")}
          </Text>
        </View>

        {showingPrompt ? (
          // Show the prompt
          <View style={styles.promptContent}>
            <Text style={styles.promptTitle}>{currentPrompt.content || currentPrompt.title}</Text>

            {isQuizOrMC && revealStep >= 1 && (
              <View style={styles.optionsContainer}>
                {/* Show enhanced results component when fully revealed and mc_results available */}
                {revealStep >= 3 && currentPrompt.mc_results ? (
                  <MultipleChoiceResults
                    results={currentPrompt.mc_results}
                    showCorrectAnswer={currentPrompt.type === 'quiz'}
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
                            {votersForOption.map((v, vi) => (
                              <View key={vi} style={styles.voterDot} />
                            ))}
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

            {isQuiplash && (
              <View style={styles.quiplashResults}>
                {currentPrompt.quiplash_data?.map((participant, i) => {
                  const isWinner = currentPrompt.quiplash_data &&
                    participant.votes === Math.max(...currentPrompt.quiplash_data.map(p => p.votes));

                  return (
                    <View
                      key={i}
                      style={[styles.quiplashEntry, isWinner && styles.quiplashWinner]}
                    >
                      <Text style={styles.quiplashAnswer}>
                        "{participant.response?.content || "(no answer)"}"
                      </Text>
                      <View style={styles.quiplashMeta}>
                        <Text style={[styles.quiplashVotes, isWinner && styles.quiplashVotesWinner]}>
                          {isWinner ? "WINNER " : ""}{participant.votes} votes
                        </Text>
                        <Text style={styles.quiplashName}>
                          — Player {participant.user_id.slice(0, 6)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.swipeHint}>
              {isQuizOrMC && revealStep < 3
                ? "tap to reveal →"
                : responses.length > 0 && !isQuizOrMC && !isQuiplash
                ? "tap to see responses →"
                : "tap for next →"}
            </Text>
          </View>
        ) : (
          // Regular response view
          <View style={styles.responseContainer}>
            {currentResponse?.media_url ? (
              signedPhotoUrl ? (
                <Image
                  source={{ uri: signedPhotoUrl }}
                  style={styles.responsePhoto}
                  contentFit="cover"
                  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                  transition={300}
                                  />
              ) : (
                <View style={[styles.responsePhoto, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card }]}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>Loading photo...</Text>
                </View>
              )
            ) : null}

            <Text style={styles.responseContent}>
              {currentResponse?.content || "(no text)"}
            </Text>

            <Text style={styles.responseAuthor}>
              — Player {currentResponse?.user_id.slice(0, 6)}
            </Text>

            {/* Reaction bar */}
            {currentResponse?.response_id && (
              <View style={styles.reactionContainer}>
                <ReactionBar responseId={currentResponse.response_id} />
              </View>
            )}

            <Text style={styles.responseCount}>
              {currentResponseIndex + 1} of {responses.length}
            </Text>

            <Text style={styles.swipeHint}>
              {currentResponseIndex < responses.length - 1 ? "tap for next response →" : "tap for next prompt →"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Comment input - show for responses OR for quiz/MC prompts */}
      {((!showingPrompt && !isQuiplash) || (showingPrompt && isQuizOrMC && responses.length > 0)) && (
        <View style={styles.commentContainer}>
          {/* Open full comment sheet */}
          <TouchableOpacity
            style={styles.viewCommentsButton}
            onPress={() => setShowCommentSheet(true)}
          >
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.muted} />
            <Text style={styles.viewCommentsText}>
              {comments.length > 0 ? `${comments.length} comments` : 'Comments'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Drop a comment..."
            placeholderTextColor={COLORS.muted}
            maxLength={200}
          />
          <TouchableOpacity style={styles.commentButton} onPress={submitComment}>
            <Ionicons name="send" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating comments */}
      <View style={styles.floatingComments} pointerEvents="none">
        {comments.slice(-5).map((c, i, arr) => (
          <FloatingComment key={c.id} comment={c} index={i} total={arr.length} />
        ))}
      </View>

      {/* Comment sheet modal */}
      {currentResponse?.response_id && (
        <CommentSheet
          visible={showCommentSheet}
          responseId={currentResponse.response_id}
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
    fontWeight: "900",
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
    fontWeight: "600",
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
    fontWeight: "900",
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
    justifyContent: "center",
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
    fontWeight: "600",
    textTransform: "capitalize",
  },
  promptContent: {
    alignItems: "center",
  },
  promptTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 36,
  },
  swipeHint: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 40,
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
    fontWeight: "700",
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
    fontWeight: "700",
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
  checkMark: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  // Quiplash
  quiplashResults: {
    marginTop: 30,
    width: "100%",
  },
  quiplashEntry: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  quiplashWinner: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + "10",
  },
  quiplashAnswer: {
    color: COLORS.text,
    fontSize: 18,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 26,
  },
  quiplashMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quiplashVotes: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  quiplashVotesWinner: {
    color: COLORS.gold,
  },
  quiplashName: {
    color: COLORS.muted,
    fontSize: 14,
  },
  // Response view
  responseContainer: {
    alignItems: "center",
  },
  responsePhoto: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 16,
    marginBottom: 20,
  },
  responseContent: {
    fontSize: 22,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 20,
  },
  responseAuthor: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 20,
  },
  responseCount: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  reactionContainer: {
    marginTop: 16,
    alignSelf: "center",
  },
  // Comments
  commentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  viewCommentsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
  },
  viewCommentsText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  commentButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingComments: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  floatingComment: {
    position: "absolute",
    right: 0,
    backgroundColor: COLORS.accent + "DD",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 200,
  },
  floatingCommentText: {
    color: COLORS.text,
    fontSize: 13,
  },
  // Leaderboard
  leaderboardContent: {
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  leaderboardTitle: {
    fontSize: 32,
    fontWeight: "900",
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
  leaderboardWinner: {
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + "15",
  },
  leaderboardRankContainer: {
    width: 40,
    height: 40,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardRankText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.muted,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  leaderboardBreakdown: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  leaderboardPoints: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: "900",
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
    fontWeight: "600",
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
    fontWeight: "700",
  },
});
