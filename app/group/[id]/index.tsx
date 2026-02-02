// app/group/[id]/index.tsx
import { useGlobalSearchParams, router } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Alert, ScrollView, Text, View, Pressable, RefreshControl, Animated, Dimensions, Easing, Modal, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

import { supabase } from "../../../lib/supabase";
import { PromptCard } from "../../../components/prompts";
import { QuiplashCard } from "../../../components/prompts/QuiplashCard";
import { QuiplashVotingCard } from "../../../components/prompts/QuiplashVotingCard";
import { getMyQuiplash, getQuiplashMatchups, QuiplashAssignment, QuiplashMatchup } from "../../../lib/services/quiplashService";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "../../../components/PixelCharacter";
import { DetailedCampfire, DetailedPineTree, DetailedGrass } from "../../../components/PixelArt";
import type { GroupStatus, GroupPrompt } from "../../../lib/types/prompts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#1E4ED8";
const BTN_ORANGE = "#FF6B35";
const DANGER = "#EF4444";

// Soft glowing text component
function FireText({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ position: "relative" }, style]}>
      {/* Soft outer glow */}
      <Text style={{
        color: "transparent",
        fontSize: 28,
        fontWeight: "900",
        textShadowColor: "#F59E0B",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        position: "absolute",
      }}>
        {children}
      </Text>
      {/* Inner glow */}
      <Text style={{
        color: "transparent",
        fontSize: 28,
        fontWeight: "900",
        textShadowColor: "#FCD34D",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        position: "absolute",
      }}>
        {children}
      </Text>
      {/* Main text - soft yellow */}
      <Text style={{
        color: "#FEF3C7",
        fontSize: 28,
        fontWeight: "900",
      }}>
        {children}
      </Text>
    </View>
  );
}

// Pixel back arrow icon
function PixelBackIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.5, height: size * 0.12, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "-45deg" }, { translateY: -size * 0.15 }] }} />
      <View style={{ width: size * 0.5, height: size * 0.12, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "45deg" }, { translateY: size * 0.15 }] }} />
      <View style={{ width: size * 0.6, height: size * 0.12, backgroundColor: TEXT, position: "absolute", left: size * 0.1 }} />
    </View>
  );
}

// Pixel gear icon for settings - 8 tooth metallic gear
function PixelGearIcon({ size = 24 }: { size?: number }) {
  const s = size / 24; // Scale factor
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Gear teeth - 8 directions */}
      {/* Top */}
      <View style={{ position: "absolute", top: 0, width: 6*s, height: 6*s, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", top: 0, width: 6*s, height: 3*s, backgroundColor: "#9CA3AF" }} />
      <View style={{ position: "absolute", top: 0, left: 9*s, width: 1*s, height: 2*s, backgroundColor: "#1F2937" }} />
      {/* Bottom */}
      <View style={{ position: "absolute", bottom: 0, width: 6*s, height: 6*s, backgroundColor: "#4B5563" }} />
      <View style={{ position: "absolute", bottom: 1*s, width: 6*s, height: 2*s, backgroundColor: "#6B7280" }} />
      {/* Left */}
      <View style={{ position: "absolute", left: 0, width: 6*s, height: 6*s, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", left: 0, width: 3*s, height: 6*s, backgroundColor: "#9CA3AF" }} />
      {/* Right */}
      <View style={{ position: "absolute", right: 0, width: 6*s, height: 6*s, backgroundColor: "#4B5563" }} />
      <View style={{ position: "absolute", right: 0, width: 2*s, height: 6*s, backgroundColor: "#374151" }} />
      {/* Diagonal teeth */}
      <View style={{ position: "absolute", top: 2*s, left: 2*s, width: 5*s, height: 5*s, backgroundColor: "#6B7280", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", top: 2*s, right: 2*s, width: 5*s, height: 5*s, backgroundColor: "#4B5563", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", bottom: 2*s, left: 2*s, width: 5*s, height: 5*s, backgroundColor: "#6B7280", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", bottom: 2*s, right: 2*s, width: 5*s, height: 5*s, backgroundColor: "#374151", transform: [{ rotate: "45deg" }] }} />
      {/* Center body */}
      <View style={{ width: 14*s, height: 14*s, borderRadius: 7*s, backgroundColor: "#6B7280", position: "absolute" }} />
      <View style={{ width: 12*s, height: 12*s, borderRadius: 6*s, backgroundColor: "#9CA3AF", position: "absolute", top: 5*s }} />
      <View style={{ width: 14*s, height: 7*s, borderRadius: 7*s, backgroundColor: "#9CA3AF", position: "absolute", top: 5*s }} />
      {/* Inner ring */}
      <View style={{ width: 10*s, height: 10*s, borderRadius: 5*s, backgroundColor: "#4B5563", position: "absolute" }} />
      <View style={{ width: 8*s, height: 8*s, borderRadius: 4*s, backgroundColor: "#6B7280", position: "absolute" }} />
      {/* Center hole */}
      <View style={{ width: 5*s, height: 5*s, borderRadius: 2.5*s, backgroundColor: "#1F2937", position: "absolute" }} />
      {/* Black outline effect */}
      <View style={{ width: size, height: size, borderRadius: 2*s, borderWidth: 1, borderColor: "#1F2937", position: "absolute", opacity: 0.3 }} />
    </View>
  );
}

// Pixel copy icon
function PixelCopyIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: "absolute", top: 0, left: 0, width: size * 0.7, height: size * 0.7, borderWidth: 2, borderColor: TEXT, backgroundColor: "transparent" }} />
      <View style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.7, height: size * 0.7, borderWidth: 2, borderColor: TEXT, backgroundColor: CARD }} />
    </View>
  );
}

// Pixel share icon
function PixelShareIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.25, height: size * 0.25, backgroundColor: TEXT, borderRadius: size * 0.125 }} />
      <View style={{ width: size * 0.1, height: size * 0.4, backgroundColor: TEXT, marginTop: -size * 0.05 }} />
      <View style={{
        position: "absolute",
        top: size * 0.15,
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.2,
        borderRightWidth: size * 0.2,
        borderBottomWidth: size * 0.25,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: TEXT,
        transform: [{ rotate: "180deg" }],
      }} />
      <View style={{ position: "absolute", bottom: 0, width: size * 0.7, height: size * 0.35, borderWidth: 2, borderColor: TEXT, borderTopWidth: 0, backgroundColor: "transparent" }} />
    </View>
  );
}

// Pixel person icon
function PixelPersonIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: TEXT, borderRadius: size * 0.175 }} />
      <View style={{ width: size * 0.6, height: size * 0.35, backgroundColor: TEXT, borderTopLeftRadius: size * 0.15, borderTopRightRadius: size * 0.15, marginTop: size * 0.05 }} />
    </View>
  );
}

// Pixel calendar icon
function PixelCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size * 0.8, backgroundColor: TEXT, borderRadius: size * 0.1, position: "absolute", bottom: 0 }}>
        <View style={{ position: "absolute", top: size * 0.15, left: size * 0.15, right: size * 0.15, height: size * 0.1, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.35, left: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.35, right: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.55, left: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
      </View>
      <View style={{ position: "absolute", top: 0, left: size * 0.2, width: size * 0.12, height: size * 0.25, backgroundColor: TEXT }} />
      <View style={{ position: "absolute", top: 0, right: size * 0.2, width: size * 0.12, height: size * 0.25, backgroundColor: TEXT }} />
    </View>
  );
}

// Pixel door/leave icon
function PixelDoorIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.6, height: size * 0.85, backgroundColor: "#78350F", borderRadius: size * 0.05 }}>
        <View style={{ position: "absolute", right: size * 0.1, top: size * 0.35, width: size * 0.1, height: size * 0.1, backgroundColor: "#EAB308", borderRadius: size * 0.05 }} />
      </View>
      <View style={{ position: "absolute", right: 0, top: size * 0.3, width: size * 0.3, height: size * 0.1, backgroundColor: DANGER }} />
      <View style={{ position: "absolute", right: 0, width: 0, height: 0, borderTopWidth: size * 0.15, borderBottomWidth: size * 0.15, borderLeftWidth: size * 0.15, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: DANGER, top: size * 0.2 }} />
    </View>
  );
}

// Pixel star
function PixelStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
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
        opacity,
      }}
    />
  );
}



// Walking character component
function WalkingCharacter({ config }: { config: CharacterConfig }) {
  const walkAnim = useRef(new Animated.Value(20)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [facingRight, setFacingRight] = useState(true);
  const directionRef = useRef(true); // true = right, false = left

  useEffect(() => {
    // Walk animation - move back and forth
    const walkRight = () => {
      directionRef.current = true;
      setFacingRight(true);
      Animated.timing(walkAnim, {
        toValue: SCREEN_WIDTH - 70,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(walkLeft, 800); // Pause before turning
      });
    };

    const walkLeft = () => {
      directionRef.current = false;
      setFacingRight(false);
      Animated.timing(walkAnim, {
        toValue: 20,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(walkRight, 800); // Pause before turning
      });
    };

    // Bounce animation - slight up/down while walking (walk cycle)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -2,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start walking
    walkRight();

    return () => {
      walkAnim.stopAnimation();
      bounceAnim.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 35,
        left: 0,
        transform: [
          { translateX: walkAnim },
          { translateY: bounceAnim },
          { scaleX: facingRight ? 1 : -1 }, // Flip when walking left
        ],
        zIndex: 100,
        overflow: "visible", // Allow poses with extended arms to show
      }}
    >
      <PixelCharacter config={config} size={50} />
    </Animated.View>
  );
}

// Wrapper that loads user profile and shows walking character
function UserWalkingCharacter() {
  const [avatarConfig, setAvatarConfig] = useState<CharacterConfig | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_config")
        .eq("id", userData.user.id)
        .single();

      if (profile?.avatar_config) {
        setAvatarConfig(profile.avatar_config as CharacterConfig);
      } else {
        setAvatarConfig(DEFAULT_CHARACTER);
      }
    };

    loadProfile();
  }, []);

  if (!avatarConfig) return null;

  return <WalkingCharacter config={avatarConfig} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
      }}
    >
      {children}
    </View>
  );
}

function Button({
  title,
  onPress,
  variant = "solid",
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "solid" | "outline";
  disabled?: boolean;
}) {
  const isSolid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: isSolid ? BTN : "transparent",
        borderColor: BORDER,
        borderWidth: isSolid ? 0 : 1,
        paddingVertical: 14,
        borderRadius: 14,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: TEXT, textAlign: "center", fontWeight: "800", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}

// Check if fireside should be visible (Sunday 9 PM EST to Monday 3 AM EST)
function isFiresideTime(): boolean {
  const now = new Date();

  // Convert to EST (UTC-5) - note: this doesn't account for DST perfectly
  // but for the purposes of this app it should be close enough
  const estOffset = -5 * 60; // EST is UTC-5
  const localOffset = now.getTimezoneOffset();
  const estTime = new Date(now.getTime() + (localOffset + estOffset) * 60 * 1000);

  const day = estTime.getDay(); // 0 = Sunday
  const hour = estTime.getHours();

  // Sunday 9 PM (21:00) to Monday 3 AM (03:00)
  // Sunday: day === 0, hour >= 21
  // Monday: day === 1, hour < 3
  if (day === 0 && hour >= 21) return true;
  if (day === 1 && hour < 3) return true;

  return false;
}

export default function GroupScreen() {
  const params = useGlobalSearchParams();
  const raw = (params as any)?.id ?? (params as any)?.Id;
  const groupId = typeof raw === "string" ? raw : undefined;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<GroupStatus | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [groupCreatedAt, setGroupCreatedAt] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [myAvatar, setMyAvatar] = useState<CharacterConfig | null>(null);
  const [quiplashAssignment, setQuiplashAssignment] = useState<QuiplashAssignment | null>(null);
  const [pendingQuiplashVotes, setPendingQuiplashVotes] = useState<QuiplashMatchup[]>([]);
  const [showFireside, setShowFireside] = useState(isFiresideTime());

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const active = status?.active_prompt_instance ?? null;
  const hasResponded = status?.has_responded ?? false;
  const hasRated = status?.has_rated ?? false;
  const userRating = status?.user_rating ?? null;

  // Check if active prompt is quiplash (we handle those separately)
  const isQuiplashPrompt = active?.prompts?.type === 'quiplash';

  // Stars for background
  const stars = [
    { x: 20, y: 80, size: 2, delay: 0 },
    { x: 80, y: 120, size: 3, delay: 200 },
    { x: 150, y: 60, size: 2, delay: 400 },
    { x: 220, y: 100, size: 2, delay: 100 },
    { x: 280, y: 70, size: 3, delay: 300 },
    { x: 340, y: 110, size: 2, delay: 500 },
    { x: 50, y: 160, size: 2, delay: 150 },
    { x: 120, y: 180, size: 2, delay: 350 },
    { x: 200, y: 150, size: 3, delay: 250 },
    { x: 300, y: 140, size: 2, delay: 450 },
  ];

  // Check fireside time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setShowFireside(isFiresideTime());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadStatus = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // Load regular prompt status
      const { data, error } = await supabase.rpc("get_group_status", { p_group_id: groupId });
      if (error) throw error;
      setStatus(data as GroupStatus);

      // Load quiplash assignment (for submitting)
      const quiplash = await getMyQuiplash(groupId);
      setQuiplashAssignment(quiplash);

      // Load quiplash matchups for voting (mid-week voting)
      const matchups = await getQuiplashMatchups(groupId);
      // Filter to only matchups user can vote on and hasn't voted yet
      const votable = matchups.filter(m => m.can_vote && !m.has_voted && m.responses.length >= 2);
      setPendingQuiplashVotes(votable);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? String(e));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadGroupInfo = useCallback(async () => {
    if (!groupId) return;
    try {
      // Load group details
      const { data, error } = await supabase
        .from("groups")
        .select("name, code, created_at")
        .eq("id", groupId)
        .single();
      if (!error && data) {
        setGroupName(data.name);
        setGroupCode(data.code);
        setGroupCreatedAt(data.created_at);
      }

      // Load member count
      const { count, error: countError } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      if (!countError && count !== null) {
        setMemberCount(count);
      }

      // Load my avatar
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_config")
          .eq("id", userData.user.id)
          .single();
        if (profile?.avatar_config) {
          setMyAvatar(profile.avatar_config as CharacterConfig);
        }
      }
    } catch {
      // Ignore - not critical
    }
  }, [groupId]);

  // Helper functions for settings modal
  const copyCode = async () => {
    if (!groupCode) return;
    await Clipboard.setStringAsync(groupCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!groupCode || !groupName) return;
    try {
      await Share.share({
        message: `Join my circle "${groupName}" on Stokie! Use code: ${groupCode}`,
      });
    } catch (e) {
      // User cancelled
    }
  };

  const leaveGroup = async () => {
    Alert.alert(
      "Leave Circle?",
      "Are you sure you want to leave this circle? You can rejoin later with the invite code.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setLeaving(true);
            try {
              const { data: userData } = await supabase.auth.getUser();
              if (!userData?.user) throw new Error("Not logged in");

              const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", groupId)
                .eq("user_id", userData.user.id);

              if (error) throw error;

              // Verify the delete actually happened
              const { data: verifyData } = await supabase
                .from("group_members")
                .select("id")
                .eq("group_id", groupId)
                .eq("user_id", userData.user.id)
                .maybeSingle();

              if (verifyData) {
                throw new Error("Failed to leave - please try again");
              }

              setShowSettingsModal(false);
              // Navigate to home with refresh timestamp to force data reload
              // Use the href object form for expo-router
              router.replace({
                pathname: "/(tabs)",
                params: { refresh: Date.now().toString() }
              });
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Failed to leave circle");
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  }, [loadStatus]);

  useEffect(() => {
    loadStatus();
    loadGroupInfo();
  }, [loadStatus, loadGroupInfo]);

  const handleSubmitted = () => {
    loadStatus();
  };

  const handleExpired = () => {
    loadStatus();
  };

  if (!groupId) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18 }}>
        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
          Missing group id. Go back and tap the group again.
        </Text>
        <Text style={{ color: MUTED, marginTop: 12 }}>Debug params: {JSON.stringify(params)}</Text>
      </ScrollView>
    );
  }

  // Check if prompts are still active (not expired)
  const now = new Date();

  // IMPORTANT: The 3 states we want to show:
  // 1. PROMPT ACTIVE (unanswered): Show the prompt card with timer
  // 2. SUBMITTED (before midnight): Show "You submitted!" message
  // 3. NOTHING (no active prompt or after midnight): Show "Nothing here, go touch grass"

  // Check if there's a regular prompt (non-quiplash) that the user hasn't answered yet
  // active_prompt_instance is ONLY returned if user hasn't responded to it
  const hasRegularPrompt = active && !isQuiplashPrompt;

  // Check if there's a quiplash the user hasn't answered yet
  const hasQuiplash = quiplashAssignment?.has_assignment;
  const isQuiplashActive = quiplashAssignment?.expires_at && new Date(quiplashAssignment.expires_at) > now;
  const hasUnansweredQuiplash = hasQuiplash && !quiplashAssignment?.has_responded && isQuiplashActive;

  // Is there ANY prompt the user needs to answer?
  const hasUnansweredPrompt = hasRegularPrompt || hasUnansweredQuiplash;

  // Check if we should show "submitted" state
  // This should ONLY show if:
  // 1. User has responded to the current day's prompt (hasResponded is true from RPC)
  // 2. The prompt hasn't expired yet (still before midnight)
  // NOTE: active_prompt_instance is NULL if user responded, but active_expires_at is still set
  const isBeforeMidnight = status?.active_expires_at && new Date(status.active_expires_at) > now;

  // hasResponded from RPC means user responded to TODAY's prompt
  // We only show "submitted" if they responded AND it's before midnight
  const showRespondedState = hasResponded && isBeforeMidnight;

  // Show empty/responded view when there are no unanswered prompts AND no pending votes
  const hasPendingVotes = pendingQuiplashVotes.length > 0;
  const shouldShowEmptyOrRespondedView = !loading && !hasUnansweredPrompt && !hasPendingVotes;

  if (shouldShowEmptyOrRespondedView) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        {/* Stars */}
        {stars.map((star, i) => (
          <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
        ))}

        {/* Ground */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "#152515" }} />

        {/* Walking character */}
        <UserWalkingCharacter />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingTop: 60, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MUTED} />
          }
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                padding: 10,
                backgroundColor: CARD,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
                marginRight: 12,
              }}
            >
              <PixelBackIcon size={22} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <FireText style={{ marginBottom: 4 }}>
                {groupName ?? "Group"}
              </FireText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {myAvatar && (
                  <View style={{ marginRight: 2 }}>
                    <PixelCharacter config={myAvatar} size={20} />
                  </View>
                )}
                <Text style={{ color: MUTED, fontSize: 12, opacity: 0.6 }}>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setCodeCopied(false);
                setShowSettingsModal(true);
              }}
              style={{
                padding: 10,
                backgroundColor: CARD,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <PixelGearIcon size={22} />
            </Pressable>
          </View>

          <Card>
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              {showRespondedState ? (
                <>
                  <View style={{ marginBottom: 8 }}>
                    <DetailedCampfire size={70} showSmoke={false} />
                  </View>
                  <Text style={{ color: "#4ADE80", fontSize: 22, fontWeight: "900", marginTop: 8, textAlign: "center" }}>
                    Relax, you already submitted.
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 16, marginTop: 8, textAlign: "center" }}>
                    Go call your Mom.
                  </Text>
                </>
              ) : (
                <>
                  <DetailedGrass size={60} variant={1} />
                  <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900", marginTop: 16, textAlign: "center" }}>
                    Nothing here.
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 16, marginTop: 8, textAlign: "center" }}>
                    Go touch some grass.
                  </Text>
                </>
              )}
            </View>

            <View style={{ marginTop: 16 }}>
              <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />
            </View>
          </Card>

          {/* Fireside Button - only show during fireside hours */}
          {showFireside && (
            <Pressable
              onPress={() => router.push(`/group/${groupId}/lowdown`)}
              style={{
                marginTop: 12,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#1a1a2e",
                borderWidth: 2,
                borderColor: "#2a2a4e",
              }}
            >
              <View style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
              }}>
                {/* Campfire */}
                <DetailedCampfire size={70} showSmoke={false} />

                <Text style={{
                  color: TEXT,
                  fontWeight: "800",
                  fontSize: 16,
                  marginTop: 8,
                  textShadowColor: "#FF6B35",
                  textShadowRadius: 8,
                }}>
                  Weekly Fireside
                </Text>
                <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                  Gather 'round the fire
                </Text>
              </View>

              {/* Glow effect at bottom */}
              <View style={{
                height: 3,
                backgroundColor: "#FF6B35",
                opacity: 0.7,
              }} />
            </Pressable>
          )}
        </ScrollView>

        {/* Settings Modal */}
        <Modal
          visible={showSettingsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            justifyContent: "flex-end",
          }}>
            <View style={{
              backgroundColor: BG,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: BORDER,
              padding: 24,
              paddingBottom: 40,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>
                  Circle Settings
                </Text>
                <Pressable
                  onPress={() => setShowSettingsModal(false)}
                  style={{
                    padding: 8,
                    backgroundColor: CARD,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>X</Text>
                </Pressable>
              </View>

              {/* Invite Code Section */}
              <View style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}>
                <Text style={{ color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
                  INVITE CODE
                </Text>
                <View style={{
                  backgroundColor: "rgba(10, 16, 32, 0.9)",
                  borderColor: BTN_ORANGE,
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  alignItems: "center",
                }}>
                  <Text style={{
                    color: TEXT,
                    fontSize: 28,
                    fontWeight: "900",
                    letterSpacing: 4,
                    fontFamily: "monospace",
                  }}>
                    {groupCode || "------"}
                  </Text>
                </View>

                {/* Copy and Share buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={copyCode}
                    style={{
                      flex: 1,
                      backgroundColor: codeCopied ? "#4ADE80" : "transparent",
                      borderColor: codeCopied ? "#4ADE80" : BORDER,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <PixelCopyIcon size={16} />
                    <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                      {codeCopied ? "Copied!" : "Copy"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={shareCode}
                    style={{
                      flex: 1,
                      backgroundColor: BTN_ORANGE,
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <PixelShareIcon size={16} />
                    <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Group Info */}
              <View style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <PixelPersonIcon size={20} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>MEMBERS</Text>
                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                      {memberCount} {memberCount === 1 ? "person" : "people"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <PixelCalendarIcon size={20} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>STARTED</Text>
                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                      {formatDate(groupCreatedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Leave Group Button */}
              <Pressable
                onPress={leaveGroup}
                disabled={leaving}
                style={{
                  backgroundColor: "transparent",
                  borderColor: DANGER,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: leaving ? 0.5 : 1,
                }}
              >
                <PixelDoorIcon size={20} />
                <Text style={{ color: DANGER, fontWeight: "700", fontSize: 14 }}>
                  {leaving ? "Leaving..." : "Leave Circle"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
      ))}

      {/* Ground */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "#152515" }} />

      {/* Walking character */}
      <UserWalkingCharacter />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingTop: 60, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MUTED} />
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 10,
              backgroundColor: CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER,
              marginRight: 12,
            }}
          >
            <PixelBackIcon size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <FireText style={{ marginBottom: 4 }}>
              {groupName ?? "Group"}
            </FireText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {myAvatar && (
                <View style={{ marginRight: 2 }}>
                  <PixelCharacter config={myAvatar} size={20} />
                </View>
              )}
              <Text style={{ color: MUTED, fontSize: 12, opacity: 0.6 }}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setCodeCopied(false);
              setShowSettingsModal(true);
            }}
            style={{
              padding: 10,
              backgroundColor: CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
            <PixelGearIcon size={22} />
          </Pressable>
        </View>

        {loading ? (
          <Card>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
              Loading...
            </Text>
          </Card>
        ) : (
          <>
            {/* Regular prompt (non-quiplash) */}
            {hasRegularPrompt && (
              <PromptCard
                groupPrompt={active as GroupPrompt}
                groupId={groupId}
                hasResponded={hasResponded}
                hasRated={hasRated}
                userRating={userRating}
                onSubmitted={handleSubmitted}
                onExpired={handleExpired}
              />
            )}

            {/* Quiplash prompt (separate card) - only show if unanswered */}
            {hasUnansweredQuiplash && (
              <>
                {hasRegularPrompt && <View style={{ height: 16 }} />}
                <QuiplashCard groupId={groupId} onSubmitted={handleSubmitted} />
              </>
            )}

            {/* Quiplash voting (mid-week) */}
            {pendingQuiplashVotes.length > 0 && (
              <>
                {(hasRegularPrompt || hasUnansweredQuiplash) && <View style={{ height: 16 }} />}
                <QuiplashVotingCard groupId={groupId} onVoted={handleSubmitted} />
              </>
            )}
          </>
        )}

        <View style={{ height: 12 }} />
        <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />

        {/* Fireside Button - only show during fireside hours */}
        {showFireside && (
          <Pressable
            onPress={() => router.push(`/group/${groupId}/lowdown`)}
            style={{
              marginTop: 12,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#1a1a2e",
              borderWidth: 2,
              borderColor: "#2a2a4e",
            }}
          >
            <View style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: "center",
            }}>
              {/* Campfire */}
              <DetailedCampfire size={70} showSmoke={false} />

              <Text style={{
                color: TEXT,
                fontWeight: "800",
                fontSize: 16,
                marginTop: 8,
                textShadowColor: "#FF6B35",
                textShadowRadius: 8,
              }}>
                Weekly Fireside
              </Text>
              <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                Gather 'round the fire
              </Text>
            </View>

            {/* Glow effect at bottom */}
            <View style={{
              height: 3,
              backgroundColor: "#FF6B35",
              opacity: 0.7,
            }} />
          </Pressable>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "flex-end",
        }}>
          <View style={{
            backgroundColor: BG,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: BORDER,
            padding: 24,
            paddingBottom: 40,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>
                Circle Settings
              </Text>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                style={{
                  padding: 8,
                  backgroundColor: CARD,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>X</Text>
              </Pressable>
            </View>

            {/* Invite Code Section */}
            <View style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{ color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
                INVITE CODE
              </Text>
              <View style={{
                backgroundColor: "rgba(10, 16, 32, 0.9)",
                borderColor: BTN_ORANGE,
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 12,
                alignItems: "center",
              }}>
                <Text style={{
                  color: TEXT,
                  fontSize: 28,
                  fontWeight: "900",
                  letterSpacing: 4,
                  fontFamily: "monospace",
                }}>
                  {groupCode || "------"}
                </Text>
              </View>

              {/* Copy and Share buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={copyCode}
                  style={{
                    flex: 1,
                    backgroundColor: codeCopied ? "#4ADE80" : "transparent",
                    borderColor: codeCopied ? "#4ADE80" : BORDER,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <PixelCopyIcon size={16} />
                  <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                    {codeCopied ? "Copied!" : "Copy"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={shareCode}
                  style={{
                    flex: 1,
                    backgroundColor: BTN_ORANGE,
                    borderRadius: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <PixelShareIcon size={16} />
                  <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                    Share
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Group Info */}
            <View style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <PixelPersonIcon size={20} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>MEMBERS</Text>
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                    {memberCount} {memberCount === 1 ? "person" : "people"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <PixelCalendarIcon size={20} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>STARTED</Text>
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                    {formatDate(groupCreatedAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Leave Group Button */}
            <Pressable
              onPress={leaveGroup}
              disabled={leaving}
              style={{
                backgroundColor: "transparent",
                borderColor: DANGER,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: leaving ? 0.5 : 1,
              }}
            >
              <PixelDoorIcon size={20} />
              <Text style={{ color: DANGER, fontWeight: "700", fontSize: 14 }}>
                {leaving ? "Leaving..." : "Leave Circle"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
