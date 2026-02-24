// app/(tabs)/index.tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Dimensions,
  Modal,
  Share,
  RefreshControl,
} from "react-native";
import Animated, { FadeInDown, FadeIn, SlideInUp, SlideOutDown, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";

import { useMyGroups, useCreateGroup, useJoinGroup, GroupRow } from "../../lib/hooks/useMyGroups";
import { AnimatedLogo } from "../../components/AnimatedLogo";
import { PixelCharacter, DEFAULT_CHARACTER } from "../../components/PixelCharacter";
import { PixelLake, LakeCreatures } from "../../components/PixelLake";
import { NightSky, ForestGround } from "../../components/sky";
import { PixelTitle } from "../../components/PixelTitle";
import { CampfireColors, Spacing, Radii, Typography, Shadows } from "../../constants/theme";
import { FireStreakBadge } from "../../components/FireStreakBadge";
import { Stagger } from "../../constants/animations";
import { FeedbackModal } from "../../components/FeedbackModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Use centralized colors
const { TEXT, TEXT_WARM, MUTED, BTN_PRIMARY: BTN, BTN_HOVER, BTN_OUTLINE, CARD, CARD_BORDER } = CampfireColors;

// Cute sparkle star icon (for create button)
function PixelSparkle({ size = 16 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.2, height: size * 0.7, backgroundColor: "#FFD93D", position: "absolute", borderRadius: size * 0.1 }} />
      <View style={{ width: size * 0.7, height: size * 0.2, backgroundColor: "#FFD93D", position: "absolute", borderRadius: size * 0.1 }} />
      <View style={{ width: size * 0.15, height: size * 0.5, backgroundColor: "#FFE88A", position: "absolute", transform: [{ rotate: "45deg" }], borderRadius: size * 0.08 }} />
      <View style={{ width: size * 0.15, height: size * 0.5, backgroundColor: "#FFE88A", position: "absolute", transform: [{ rotate: "-45deg" }], borderRadius: size * 0.08 }} />
      <View style={{ width: size * 0.15, height: size * 0.15, backgroundColor: "#FFFFFF", position: "absolute", borderRadius: size * 0.1 }} />
    </View>
  );
}

// Small compass icon for join
function PixelCompassIcon({ size = 18 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, borderWidth: 1.5, borderColor: TEXT_WARM, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderBottomWidth: size * 0.3, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: CampfireColors.FIRE_ORANGE, transform: [{ rotate: "-30deg" }] }} />
        <View style={{ width: size * 0.08, height: size * 0.08, backgroundColor: TEXT_WARM, borderRadius: size * 0.04, position: "absolute" }} />
      </View>
    </View>
  );
}

// Pixel arrow (softer)
function PixelArrow({ size = 12 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: MUTED, borderRadius: 1 }} />
      <View style={{
        position: "absolute", right: 0,
        width: 0, height: 0,
        borderTopWidth: size * 0.25,
        borderBottomWidth: size * 0.25,
        borderLeftWidth: size * 0.35,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: MUTED,
      }} />
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: CARD,
      borderColor: CARD_BORDER,
      borderWidth: 1,
      borderRadius: Radii.card,
      padding: Spacing.lg,
      marginBottom: 14,
    }}>
      {children}
    </View>
  );
}

function Button({
  title, onPress, variant = "solid", disabled,
}: {
  title: string; onPress: () => void; variant?: "solid" | "outline"; disabled?: boolean;
}) {
  const isSolid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: isSolid ? BTN : "transparent",
        borderColor: isSolid ? BTN : BTN_OUTLINE,
        borderWidth: 1,
        paddingVertical: 14,
        borderRadius: Radii.button,
        opacity: disabled ? 0.5 : 1,
        minHeight: 44,
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={{ color: TEXT, textAlign: "center", ...Typography.button }}>
        {title}
      </Text>
    </Pressable>
  );
}

function Input(props: any) {
  return (
    <TextInput
      placeholderTextColor={"#6B6058"}
      {...props}
      style={[{
        backgroundColor: CampfireColors.INPUT_BG,
        borderColor: CARD_BORDER,
        borderWidth: 1,
        borderRadius: Radii.input,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: TEXT,
        ...Typography.body,
      }, props.style]}
    />
  );
}

type CreatedGroupInfo = { id: string; name: string; code: string };

// Pixel checkmark
function PixelCheckmark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: size * 0.8, height: size * 0.8,
        backgroundColor: "#4ADE80",
        borderRadius: size * 0.4,
        alignItems: "center", justifyContent: "center",
      }}>
        <View style={{ width: size * 0.15, height: size * 0.4, backgroundColor: "#FFF", transform: [{ rotate: "45deg" }, { translateX: size * 0.08 }] }} />
        <View style={{ position: "absolute", width: size * 0.15, height: size * 0.25, backgroundColor: "#FFF", transform: [{ rotate: "-45deg" }, { translateX: -size * 0.08 }, { translateY: size * 0.05 }] }} />
      </View>
    </View>
  );
}

// Copy icon
function PixelCopyIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: "absolute", top: 0, left: 0, width: size * 0.7, height: size * 0.7, borderWidth: 1.5, borderColor: TEXT, backgroundColor: "transparent", borderRadius: 3 }} />
      <View style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.7, height: size * 0.7, borderWidth: 1.5, borderColor: TEXT, backgroundColor: CARD, borderRadius: 3 }} />
    </View>
  );
}

// Share icon
function PixelShareIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.22, height: size * 0.22, backgroundColor: TEXT, borderRadius: size * 0.11 }} />
      <View style={{ width: size * 0.08, height: size * 0.35, backgroundColor: TEXT, marginTop: -size * 0.04 }} />
      <View style={{
        position: "absolute", top: size * 0.12,
        width: 0, height: 0,
        borderLeftWidth: size * 0.18, borderRightWidth: size * 0.18,
        borderBottomWidth: size * 0.22,
        borderLeftColor: "transparent", borderRightColor: "transparent",
        borderBottomColor: TEXT,
        transform: [{ rotate: "180deg" }],
      }} />
      <View style={{ position: "absolute", bottom: 0, width: size * 0.6, height: size * 0.3, borderWidth: 1.5, borderColor: TEXT, borderTopWidth: 0, backgroundColor: "transparent", borderRadius: 3 }} />
    </View>
  );
}


// Stump button component
function PixelStump({ size = 50, label, onPress, icon }: { size?: number; label?: string; onPress?: () => void; icon?: React.ReactNode }) {
  const scale = size / 50;
  const pressScale = useSharedValue(1);

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Pixel block helper - hard edges, grid-based
  const Block = ({ w, h, color, x = 0, y = 0 }: { w: number; h: number; color: string; x?: number; y?: number }) => (
    <View style={{
      position: "absolute",
      left: x * scale,
      top: y * scale,
      width: w * scale,
      height: h * scale,
      backgroundColor: color,
    }} />
  );

  const content = (
    <Animated.View style={[{ alignItems: "center", width: 80 * scale, position: "relative" }, onPress ? animatedPressStyle : undefined]}>
      <View style={{ width: 72 * scale, height: 60 * scale, position: "relative" }}>
        {/* Stump top (cut surface) - pixel octagon approximating circle */}

        {/* Top surface base - very light wood */}
        <Block w={40} h={4} color="#E8C888" x={16} y={0} />
        <Block w={48} h={4} color="#E8C888" x={12} y={4} />
        <Block w={56} h={4} color="#E8C888" x={8} y={8} />
        <Block w={60} h={8} color="#E8C888" x={6} y={12} />
        <Block w={60} h={4} color="#E8C888" x={6} y={20} />

        {/* Tree rings - concentric pixel patterns */}
        {/* Outer ring - medium */}
        <Block w={36} h={2} color="#A87840" x={18} y={2} />
        <Block w={44} h={2} color="#A87840" x={14} y={6} />
        <Block w={52} h={2} color="#A87840" x={10} y={10} />
        <Block w={56} h={2} color="#A87840" x={8} y={14} />
        <Block w={52} h={2} color="#A87840" x={10} y={18} />

        {/* Middle ring - darker */}
        <Block w={28} h={2} color="#8B6030" x={22} y={8} />
        <Block w={36} h={2} color="#8B6030" x={18} y={12} />
        <Block w={36} h={2} color="#8B6030" x={18} y={16} />

        {/* Center - dark core */}
        <Block w={20} h={2} color="#5C4020" x={26} y={12} />
        <Block w={16} h={2} color="#5C4020" x={28} y={14} />

        {/* Bark sides - vertical strips */}
        {/* Left bark */}
        <Block w={8} h={36} color={CampfireColors.LOG_DARK} x={0} y={24} />
        <Block w={4} h={36} color="#3A2010" x={8} y={24} />

        {/* Front bark - main body */}
        <Block w={56} h={36} color={CampfireColors.LOG_MID} x={12} y={24} />

        {/* Right bark */}
        <Block w={4} h={36} color={CampfireColors.LOG_LIGHT} x={60} y={24} />
        <Block w={8} h={36} color="#2A1808" x={64} y={24} />

        {/* Bark texture - vertical grain lines (2px wide blocks) */}
        <Block w={2} h={32} color="#3A2010" x={14} y={26} />
        <Block w={2} h={28} color="#3A2010" x={24} y={28} />
        <Block w={2} h={30} color="#3A2010" x={34} y={27} />
        <Block w={2} h={26} color="#3A2010" x={44} y={30} />
        <Block w={2} h={32} color="#3A2010" x={54} y={26} />

        {/* Bark knots - darker spots */}
        <Block w={6} h={6} color="#2A1808" x={18} y={32} />
        <Block w={4} h={4} color="#2A1808" x={48} y={38} />

        {/* Shadow at base */}
        <Block w={72} h={4} color="rgba(0,0,0,0.3)" x={0} y={56} />

        {/* Label overlay */}
        {label && (
          <View style={{
            position: "absolute",
            top: 4 * scale,
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {icon}
              <Text style={{
                color: "#2A1808",
                fontSize: size * 0.28,
                fontFamily: "Paaxel",
                textShadowColor: "rgba(255, 245, 220, 0.9)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 3,
              }}>{label}</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) return (
    <Pressable
      onPressIn={() => { pressScale.value = withTiming(0.95, { duration: 80 }); }}
      onPressOut={() => { pressScale.value = withTiming(1, { duration: 120 }); }}
      onPress={onPress}
      style={{ alignItems: "center" }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
  return content;
}

export default function HomeGroupsScreen() {
  const params = useLocalSearchParams();
  const refreshKey = params.refresh as string | undefined;

  // React Query hooks for data fetching
  const { data: groups = [], isLoading: loading, refetch, isRefetching } = useMyGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");

  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroupInfo | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const canCreate = useMemo(() => newName.trim().length > 0, [newName]);
  const canJoin = useMemo(() => joinId.trim().length > 0, [joinId]);

  async function createGroup() {
    if (!canCreate) return;
    try {
      const name = newName.trim();
      const created = await createGroupMutation.mutateAsync(name);
      setNewName("");
      setCreatedGroup({ id: created.id, name: created.name || name, code: created.code });
      setCodeCopied(false);
      setShowCongratsModal(true);
    } catch (e: any) {
      // Error already handled by mutation onError
    }
  }

  async function copyCode() {
    if (!createdGroup) return;
    await Clipboard.setStringAsync(createdGroup.code);
    setCodeCopied(true);
  }

  async function shareCode() {
    if (!createdGroup) return;
    try {
      await Share.share({ message: `Join my circle "${createdGroup.name}" on Stokie! Use code: ${createdGroup.code}` });
    } catch (e) {}
  }

  function closeCongratsAndNavigate() {
    setShowCongratsModal(false);
    if (createdGroup) {
      const id = createdGroup.id;
      router.push(`/group/${id}`);
    }
  }

  async function joinGroup() {
    if (!canJoin) return;
    try {
      const code = joinId.trim().toUpperCase();
      const group = await joinGroupMutation.mutateAsync(code);
      setJoinId("");
      Alert.alert("Joined!", `You joined "${group.name || "the circle"}"!`);
      router.push(`/group/${group.id}`);
    } catch (e: any) {
      // Error already handled by mutation onError
    }
  }

  function openGroup(id: string) { router.push(`/group/${id}`); }

  // Refetch when returning from group creation
  useEffect(() => {
    if (refreshKey) {
      refetch();
    }
  }, [refreshKey]);

  // Refetch on tab focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Shared sky: gradient + moon + stars + shooting stars + fireflies */}
      <NightSky density="default" showMoon showShootingStars showFireflies />

      {/* Shared forest ground: mountains + trees + ground + wildflowers */}
      <ForestGround showMountains showWildflowers showForest />

      {/* Pixel lake - left of campfire, behind trees */}
      <View style={{ position: "absolute", bottom: 38, left: SCREEN_WIDTH / 2 - 170, zIndex: 0 }}>
        <PixelLake />
      </View>

      {/* Fish + monster - centered above the campfire */}
      <View style={{ position: "absolute", bottom: 120, left: "50%", marginLeft: -70, zIndex: 4 }}>
        <LakeCreatures />
      </View>

      {/* Campfire warm ground glow — muted for winter */}
      <View style={{
        position: "absolute", bottom: 10,
        left: "50%", marginLeft: -120,
        width: 240, height: 60,
        backgroundColor: CampfireColors.FIRE_ORANGE,
        borderRadius: 120,
        opacity: 0.08,
        zIndex: 2,
      }} />
      <View style={{
        position: "absolute", bottom: 15,
        left: "50%", marginLeft: -80,
        width: 160, height: 40,
        backgroundColor: CampfireColors.FIRE_YELLOW,
        borderRadius: 80,
        opacity: 0.05,
        zIndex: 2,
      }} />

      {/* Campfire */}
      <View style={{ position: "absolute", bottom: 8, left: "50%", marginLeft: -60, zIndex: 3 }}>
        <AnimatedLogo size={120} />
      </View>

      {/* ===== MAIN SCROLLVIEW ===== */}
      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ padding: Spacing.xl, paddingTop: 65, paddingBottom: 220 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={MUTED} />}
      >
        {/* Title with pixel fire */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
          <AnimatedLogo size={24} />
          <View style={{ width: 8 }} />
          <PixelTitle fontSize={22}>Your Circles</PixelTitle>
        </View>
        <Text style={{ color: MUTED, marginBottom: 16, letterSpacing: 0.3, ...Typography.body, fontSize: 13, textAlign: "center" }}>
          Gather 'round the fire with friends
        </Text>

        {/* Group cards */}
        {groups.map((g, index) => {
          const hasStreak = (g.current_streak ?? 0) > 0;
          const memberCount = g.member_count ?? 0;
          const avatars = g.member_avatars ?? [];
          const lastActive = relativeTime(g.created_at);

          return (
            <Animated.View key={g.id} entering={FadeInDown.delay(index * Stagger.CARD).duration(400).springify().damping(18)}>
              <Pressable onPress={() => openGroup(g.id)} disabled={loading} accessibilityRole="button" accessibilityLabel={`Open group ${g.name}`}>
                <View style={{
                  backgroundColor: CARD,
                  borderColor: hasStreak ? "rgba(255, 107, 53, 0.3)" : CARD_BORDER,
                  borderWidth: 1,
                  borderRadius: Radii.card,
                  padding: 0,
                  marginBottom: 10,
                  overflow: "hidden",
                  ...(hasStreak ? Shadows.cardGlow : {}),
                }}>
                  <View style={{ flexDirection: "row" }}>
                    {/* Warm left-edge accent */}
                    <View style={{
                      width: 3,
                      backgroundColor: hasStreak ? CampfireColors.FIRE_ORANGE : "rgba(255, 107, 53, 0.4)",
                      borderTopLeftRadius: Radii.card,
                      borderBottomLeftRadius: Radii.card,
                    }} />

                    <View style={{ flex: 1, padding: Spacing.md, flexDirection: "row" }}>
                      {/* Left content */}
                      <View style={{ flex: 1 }}>
                        {/* Name row */}
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ color: TEXT_WARM, ...Typography.heading2, fontSize: 22, flex: 1 }} numberOfLines={1}>
                            {g.name ?? "(untitled)"}
                          </Text>
                          <PixelArrow size={12} />
                        </View>

                        {/* Member count */}
                        {memberCount > 0 && (
                          <Text style={{ color: MUTED, ...Typography.caption, marginTop: 2, fontSize: 12 }}>
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                          </Text>
                        )}

                        {/* Mini avatar row */}
                        {avatars.length > 0 && (
                          <View style={{ flexDirection: "row", marginTop: 6, flexWrap: "wrap", gap: 6 }}>
                            {avatars.map((avatar: any, i: number) => (
                              <View key={i}>
                                <PixelCharacter config={avatar ?? DEFAULT_CHARACTER} size={16} />
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Created time - smaller, at the bottom */}
                        {lastActive ? (
                          <Text style={{ color: MUTED, fontSize: 10, fontFamily: "Paaxel", marginTop: 6, opacity: 0.7 }}>
                            created {lastActive}
                          </Text>
                        ) : null}
                      </View>

                      {/* Fire streak badge - middle right */}
                      {hasStreak && (
                        <View style={{ justifyContent: "center", marginLeft: 8 }}>
                          <FireStreakBadge streak={g.current_streak ?? 0} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Empty state */}
        {groups.length === 0 && !loading && (
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Card>
              <Text style={{ color: MUTED, textAlign: "center", fontStyle: "italic", ...Typography.body, fontSize: 14 }}>
                No circles yet. Tap the stumps below to create or join one!
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Anonymous feedback button */}
        <Pressable onPress={() => setShowFeedbackModal(true)} style={{ alignItems: "center", marginTop: Spacing.lg }}>
          <Text style={{ color: MUTED, ...Typography.body, fontSize: 13, opacity: 0.8 }}>
            Leave Anonymous Feedback
          </Text>
        </Pressable>

        <FeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          source="general"
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ===== STUMP BUTTONS ===== */}
      <View style={{ position: "absolute", bottom: 22, left: SCREEN_WIDTH / 2 - 150, zIndex: 20 }}>
        <PixelStump size={56} label="Create" icon={<PixelSparkle size={12} />}
          onPress={() => { setNewName(""); setShowCreateModal(true); }} />
      </View>
      <View style={{ position: "absolute", bottom: 22, left: SCREEN_WIDTH / 2 + 80, zIndex: 20 }}>
        <PixelStump size={56} label="Join" icon={<PixelCompassIcon size={12} />}
          onPress={() => { setJoinId(""); setShowJoinModal(true); }} />
      </View>

      {/* ===== CREATE CIRCLE MODAL ===== */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}
          onPress={() => setShowCreateModal(false)}
        >
          <Pressable onPress={() => {}} style={{
            backgroundColor: CampfireColors.BG_MID,
            borderColor: CARD_BORDER,
            borderWidth: 1,
            borderTopLeftRadius: Radii.modal, borderTopRightRadius: Radii.modal,
            padding: Spacing.xxl, paddingBottom: 40,
          }}>
            <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
              <View style={{ width: 40, height: 4, backgroundColor: CARD_BORDER, borderRadius: 2 }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
              <PixelSparkle size={18} />
              <View style={{ width: 8 }} />
              <Text style={{ color: TEXT_WARM, ...Typography.heading2 }}>Create a new circle</Text>
            </View>
            <Input placeholder="Circle name" value={newName} onChangeText={setNewName} />
            <View style={{ height: 12 }} />
            <Button
              title={createGroupMutation.isPending ? "..." : "Create Circle"}
              onPress={() => { createGroup(); setShowCreateModal(false); }}
              disabled={!canCreate || createGroupMutation.isPending}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== JOIN CIRCLE MODAL ===== */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}
          onPress={() => setShowJoinModal(false)}
        >
          <Pressable onPress={() => {}} style={{
            backgroundColor: CampfireColors.BG_MID,
            borderColor: CARD_BORDER,
            borderWidth: 1,
            borderTopLeftRadius: Radii.modal, borderTopRightRadius: Radii.modal,
            padding: Spacing.xxl, paddingBottom: 40,
          }}>
            <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
              <View style={{ width: 40, height: 4, backgroundColor: CARD_BORDER, borderRadius: 2 }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
              <PixelCompassIcon size={22} />
              <View style={{ width: 8 }} />
              <Text style={{ color: TEXT_WARM, ...Typography.heading2 }}>Join by invite code</Text>
            </View>
            <Input placeholder="Paste invite code" value={joinId} onChangeText={setJoinId} />
            <View style={{ height: 12 }} />
            <Button
              title={joinGroupMutation.isPending ? "..." : "Join Circle"}
              onPress={() => { joinGroup(); setShowJoinModal(false); }}
              disabled={!canJoin || joinGroupMutation.isPending}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== CONGRATS MODAL ===== */}
      <Modal visible={showCongratsModal} transparent animationType="fade" onRequestClose={() => setShowCongratsModal(false)}>
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "center", alignItems: "center",
          padding: Spacing.xxl,
        }}>
          <View style={{
            backgroundColor: CARD,
            borderColor: CARD_BORDER,
            borderWidth: 2,
            borderRadius: 20,
            padding: Spacing.xxl,
            width: "100%", maxWidth: 340,
            alignItems: "center",
          }}>
            <PixelCheckmark size={60} />

            <View style={{ marginTop: 16 }}>
              <PixelTitle fontSize={22}>Circle Created!</PixelTitle>
            </View>

            <Text style={{ color: MUTED, marginTop: 8, textAlign: "center", ...Typography.body, fontSize: 14 }}>
              Share this code with friends to invite them
            </Text>

            <View style={{
              backgroundColor: CampfireColors.INPUT_BG_DARK,
              borderColor: BTN, borderWidth: 2, borderRadius: Radii.md,
              paddingVertical: 16, paddingHorizontal: 24,
              marginTop: 20, width: "100%", alignItems: "center",
            }}>
              <Text style={{ color: TEXT, fontSize: 32, fontFamily: "monospace", letterSpacing: 4 }}>
                {createdGroup?.code}
              </Text>
            </View>

            <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>
              <Pressable
                onPress={copyCode}
                style={{
                  flex: 1,
                  backgroundColor: codeCopied ? CampfireColors.SUCCESS : "transparent",
                  borderColor: codeCopied ? CampfireColors.SUCCESS : CARD_BORDER,
                  borderWidth: 1, borderRadius: Radii.md, paddingVertical: 14,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  minHeight: 44,
                }}
                accessibilityRole="button"
                accessibilityLabel={codeCopied ? "Code copied" : "Copy invite code"}
              >
                <PixelCopyIcon size={18} />
                <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 14 }}>
                  {codeCopied ? "Copied!" : "Copy"}
                </Text>
              </Pressable>

              <Pressable
                onPress={shareCode}
                style={{
                  flex: 1,
                  backgroundColor: BTN,
                  borderRadius: Radii.md, paddingVertical: 14,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  minHeight: 44,
                }}
                accessibilityRole="button"
                accessibilityLabel="Share invite code"
              >
                <PixelShareIcon size={18} />
                <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 14 }}>Share</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={closeCongratsAndNavigate}
              style={{
                marginTop: 16, width: "100%",
                backgroundColor: "transparent",
                borderColor: CARD_BORDER, borderWidth: 1, borderRadius: Radii.md,
                paddingVertical: 14, alignItems: "center",
                minHeight: 44,
              }}
              accessibilityRole="button"
              accessibilityLabel="Enter circle"
            >
              <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 14 }}>Enter Circle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
