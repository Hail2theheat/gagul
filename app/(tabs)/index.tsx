// app/(tabs)/index.tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Animated,
  Dimensions,
  Modal,
  Share,
  RefreshControl,
} from "react-native";
import * as Clipboard from "expo-clipboard";

import { supabase } from "../../lib/supabase";
import { createGroup as createGroupDb, joinGroupByCode } from "../../lib/db";
import { DetailedCampfire, DetailedPineTree, SmallFireIcon } from "../../components/PixelArt";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Colors - cozy forest theme
const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#FF6B35";
const BTN_OUTLINE = "#4a3f35";

// Pixel art star with twinkle - multiple sizes and colors
function PixelStar({ x, y, size, delay, color = "#FFF" }: { x: number; y: number; size: number; delay: number; color?: string }) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 600 + Math.random() * 400, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.2, duration: 600 + Math.random() * 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.3, duration: 600, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  // Cross-shaped star for larger sizes
  if (size >= 3) {
    return (
      <Animated.View style={{ position: "absolute", left: x, top: y, opacity, transform: [{ scale }] }}>
        {/* Center */}
        <View style={{ width: size, height: size, backgroundColor: color, position: "absolute" }} />
        {/* Top */}
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", top: -size * 0.5, left: size * 0.2 }} />
        {/* Bottom */}
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", bottom: -size * 0.5, left: size * 0.2 }} />
        {/* Left */}
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", left: -size * 0.5, top: size * 0.2 }} />
        {/* Right */}
        <View style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, position: "absolute", right: -size * 0.5, top: size * 0.2 }} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size * 3,
      }}
    />
  );
}

// Shooting star with trail
function ShootingStar({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const startY = useRef(30 + Math.random() * 120).current;
  const startX = useRef(30 + Math.random() * (SCREEN_WIDTH * 0.6)).current;
  const length = useRef(80 + Math.random() * 60).current;

  useEffect(() => {
    const animate = () => {
      setVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 800 + Math.random() * 400,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setTimeout(animate, 4000 + Math.random() * 8000);
      });
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={{ position: "absolute", left: startX, top: startY }}>
      {/* Trail */}
      <Animated.View
        style={{
          position: "absolute",
          width: length,
          height: 2,
          backgroundColor: "transparent",
          opacity: progress.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.8, 0.6, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }) },
            { rotate: "35deg" },
          ],
        }}
      >
        <View style={{ position: "absolute", right: 0, width: "100%", height: 2, backgroundColor: "#FFF", opacity: 0.3 }} />
        <View style={{ position: "absolute", right: 0, width: "60%", height: 2, backgroundColor: "#FFF", opacity: 0.5 }} />
        <View style={{ position: "absolute", right: 0, width: "30%", height: 2, backgroundColor: "#FFF", opacity: 0.8 }} />
      </Animated.View>
      {/* Head */}
      <Animated.View
        style={{
          width: 4,
          height: 4,
          backgroundColor: "#FFF",
          borderRadius: 2,
          opacity: progress.interpolate({
            inputRange: [0, 0.1, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 120 + length] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 80 + length * 0.6] }) },
          ],
          shadowColor: "#FFF",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
        }}
      />
    </View>
  );
}

// Pixel art crescent moon
function PixelMoon() {
  return (
    <View style={{ position: "absolute", top: 60, right: 40 }}>
      {/* Main moon circle */}
      <View style={{
        width: 50,
        height: 50,
        backgroundColor: "#FFFACD",
        borderRadius: 25,
        shadowColor: "#FFFACD",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      }}>
        {/* Crescent shadow */}
        <View style={{
          position: "absolute",
          top: -5,
          right: -5,
          width: 45,
          height: 45,
          backgroundColor: BG,
          borderRadius: 22.5,
        }} />
        {/* Moon details - craters */}
        <View style={{ position: "absolute", top: 15, left: 8, width: 6, height: 6, backgroundColor: "#EEE8AA", borderRadius: 3, opacity: 0.5 }} />
        <View style={{ position: "absolute", top: 28, left: 15, width: 4, height: 4, backgroundColor: "#EEE8AA", borderRadius: 2, opacity: 0.4 }} />
        <View style={{ position: "absolute", top: 35, left: 6, width: 5, height: 5, backgroundColor: "#EEE8AA", borderRadius: 2.5, opacity: 0.3 }} />
      </View>
    </View>
  );
}


// Pixel art tent icon
function PixelTentIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 0.8, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Tent body */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.5,
        borderRightWidth: size * 0.5,
        borderBottomWidth: size * 0.7,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#8B7355",
      }}>
        {/* Door */}
        <View style={{
          position: "absolute",
          bottom: -size * 0.7,
          left: -size * 0.15,
          width: size * 0.3,
          height: size * 0.4,
          backgroundColor: "#6B5344",
          borderTopLeftRadius: size * 0.15,
          borderTopRightRadius: size * 0.15,
        }} />
      </View>
    </View>
  );
}

// Pixel art sparkle
function PixelSparkle({ size = 16 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Center */}
      <View style={{ width: size * 0.25, height: size * 0.25, backgroundColor: "#FFD93D", position: "absolute" }} />
      {/* Vertical */}
      <View style={{ width: size * 0.15, height: size * 0.8, backgroundColor: "#FFD93D", position: "absolute" }} />
      {/* Horizontal */}
      <View style={{ width: size * 0.8, height: size * 0.15, backgroundColor: "#FFD93D", position: "absolute" }} />
      {/* Diagonals */}
      <View style={{ width: size * 0.12, height: size * 0.5, backgroundColor: "#FFD93D", position: "absolute", transform: [{ rotate: "45deg" }] }} />
      <View style={{ width: size * 0.12, height: size * 0.5, backgroundColor: "#FFD93D", position: "absolute", transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

// Pixel arrow
function PixelArrow({ size = 12 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.6, height: size * 0.15, backgroundColor: MUTED }} />
      <View style={{
        position: "absolute",
        right: 0,
        width: 0,
        height: 0,
        borderTopWidth: size * 0.3,
        borderBottomWidth: size * 0.3,
        borderLeftWidth: size * 0.4,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: MUTED,
      }} />
    </View>
  );
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
        borderColor: isSolid ? BTN : BTN_OUTLINE,
        borderWidth: 1,
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

function Input(props: any) {
  return (
    <TextInput
      placeholderTextColor={"#6B5B4F"}
      {...props}
      style={[
        {
          backgroundColor: "rgba(10, 16, 32, 0.8)",
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: TEXT,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}

type GroupRow = { id: string; name: string | null; code?: string; created_at?: string };

type CreatedGroupInfo = { id: string; name: string; code: string };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error("Auth session missing!");
  return uid;
}

// Pixel checkmark icon
function PixelCheckmark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: size * 0.8,
        height: size * 0.8,
        backgroundColor: "#4ADE80",
        borderRadius: size * 0.4,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <View style={{ width: size * 0.15, height: size * 0.4, backgroundColor: "#FFF", transform: [{ rotate: "45deg" }, { translateX: size * 0.08 }] }} />
        <View style={{ position: "absolute", width: size * 0.15, height: size * 0.25, backgroundColor: "#FFF", transform: [{ rotate: "-45deg" }, { translateX: -size * 0.08 }, { translateY: size * 0.05 }] }} />
      </View>
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

export default function HomeGroupsScreen() {
  const params = useLocalSearchParams();
  const refreshKey = params.refresh as string | undefined;

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const isRefreshing = useRef(false); // Prevent multiple simultaneous refreshes

  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");

  // Congrats modal state
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroupInfo | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const canCreate = useMemo(() => newName.trim().length > 0, [newName]);
  const canJoin = useMemo(() => joinId.trim().length > 0, [joinId]);

  // Stars configuration - varied sizes and colors for depth
  const stars = [
    // Large bright stars
    { x: 80, y: 120, size: 4, delay: 0, color: "#FFF" },
    { x: 250, y: 80, size: 4, delay: 400, color: "#FFF" },
    { x: 180, y: 200, size: 4, delay: 200, color: "#FFFACD" },
    // Medium stars
    { x: 30, y: 60, size: 3, delay: 100, color: "#FFF" },
    { x: 120, y: 40, size: 3, delay: 300, color: "#E6E6FA" },
    { x: 200, y: 150, size: 3, delay: 500, color: "#FFF" },
    { x: 300, y: 100, size: 3, delay: 150, color: "#FFFACD" },
    { x: 350, y: 180, size: 3, delay: 350, color: "#FFF" },
    // Small stars
    { x: 20, y: 140, size: 2, delay: 50, color: "#FFF" },
    { x: 60, y: 180, size: 2, delay: 250, color: "#E6E6FA" },
    { x: 100, y: 90, size: 2, delay: 450, color: "#FFF" },
    { x: 140, y: 160, size: 2, delay: 550, color: "#FFF" },
    { x: 160, y: 50, size: 2, delay: 650, color: "#FFFACD" },
    { x: 220, y: 130, size: 2, delay: 750, color: "#FFF" },
    { x: 270, y: 170, size: 2, delay: 850, color: "#E6E6FA" },
    { x: 320, y: 60, size: 2, delay: 950, color: "#FFF" },
    { x: 340, y: 140, size: 2, delay: 1050, color: "#FFF" },
    // Tiny distant stars
    { x: 45, y: 100, size: 1, delay: 150, color: "#FFF" },
    { x: 90, y: 70, size: 1, delay: 350, color: "#FFF" },
    { x: 130, y: 130, size: 1, delay: 550, color: "#FFF" },
    { x: 175, y: 85, size: 1, delay: 750, color: "#FFF" },
    { x: 240, y: 110, size: 1, delay: 950, color: "#FFF" },
    { x: 285, y: 145, size: 1, delay: 1150, color: "#FFF" },
    { x: 330, y: 95, size: 1, delay: 1350, color: "#FFF" },
    { x: 365, y: 125, size: 1, delay: 1550, color: "#FFF" },
  ];

  const trees = [
    { x: -20, height: 100, shade: 0 },
    { x: 15, height: 70, shade: 1 },
    { x: 50, height: 120, shade: 0 },
    { x: 90, height: 60, shade: 2 },
    { x: SCREEN_WIDTH - 130, height: 55, shade: 2 },
    { x: SCREEN_WIDTH - 95, height: 85, shade: 1 },
    { x: SCREEN_WIDTH - 55, height: 130, shade: 0 },
    { x: SCREEN_WIDTH - 15, height: 75, shade: 1 },
  ];

  async function refresh(force = false) {
    // Prevent multiple simultaneous refreshes unless forced
    if (isRefreshing.current && !force) {
      console.log("[HomeScreen] refresh() skipped - already refreshing");
      return;
    }

    console.log("[HomeScreen] refresh() called at", Date.now(), "force:", force);
    isRefreshing.current = true;
    setLoading(true);
    // Clear groups immediately to ensure stale data is removed
    setGroups([]);

    try {
      const uid = await requireUserId();
      console.log("[HomeScreen] User ID:", uid);

      // Fresh query - explicitly get current data
      const { data: mem, error: mErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", uid);

      console.log("[HomeScreen] group_members count:", mem?.length ?? 0);

      if (mErr) throw mErr;

      const ids = (mem ?? []).map((r: any) => r.group_id).filter(Boolean);
      console.log("[HomeScreen] Group IDs:", ids);

      if (ids.length === 0) {
        console.log("[HomeScreen] No groups found");
        setGroups([]);
        return;
      }

      const { data: gs, error: gErr } = await supabase
        .from("groups")
        .select("id,name,created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });

      if (gErr) throw gErr;

      console.log("[HomeScreen] Groups loaded:", gs?.length ?? 0);
      setGroups((gs ?? []) as any);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }

  async function createGroup() {
    if (!canCreate) return;
    setLoading(true);
    try {
      const name = newName.trim();
      const created = await createGroupDb(name);

      setNewName("");
      await refresh();

      // Show congrats modal with the code
      setCreatedGroup({
        id: created.id,
        name: created.name || name,
        code: created.code,
      });
      setCodeCopied(false);
      setShowCongratsModal(true);
    } catch (e: any) {
      Alert.alert("Create failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
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
      await Share.share({
        message: `Join my circle "${createdGroup.name}" on Stokie! Use code: ${createdGroup.code}`,
      });
    } catch (e) {
      // User cancelled or error
    }
  }

  function closeCongratsAndNavigate() {
    setShowCongratsModal(false);
    if (createdGroup) {
      router.push(`/group/${createdGroup.id}`);
    }
  }

  async function joinGroup() {
    if (!canJoin) return;
    setLoading(true);
    try {
      const code = joinId.trim().toUpperCase();
      const group = await joinGroupByCode(code);

      setJoinId("");
      await refresh();
      Alert.alert("Joined!", `You joined "${group.name || "the circle"}"!`);
      router.push(`/group/${group.id}`);
    } catch (e: any) {
      Alert.alert("Join failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function openGroup(id: string) {
    router.push(`/group/${id}`);
  }

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, []);

  // Refresh when refresh key changes (e.g., after leaving a group)
  useEffect(() => {
    if (refreshKey) {
      console.log("[HomeScreen] refreshKey changed to:", refreshKey);
      // Force clear groups immediately
      setGroups([]);
      isRefreshing.current = false; // Reset refresh state

      // Immediate refresh with force flag
      const immediateRefresh = async () => {
        console.log("[HomeScreen] Forced refresh after leaving group");
        await refresh(true); // Force refresh

        // Double-check with a second refresh after a short delay
        setTimeout(async () => {
          console.log("[HomeScreen] Secondary verification refresh");
          await refresh(true); // Force again
        }, 600);
      };

      // Small delay to ensure database transaction is committed
      const timer = setTimeout(immediateRefresh, 250);
      return () => clearTimeout(timer);
    }
  }, [refreshKey]);

  // Refresh when screen comes into focus (e.g., after leaving a group)
  useFocusEffect(
    useCallback(() => {
      console.log("[HomeScreen] useFocusEffect triggered - calling refresh");
      refresh();
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Moon */}
      <PixelMoon />

      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} color={star.color} />
      ))}

      {/* Shooting stars */}
      <ShootingStar delay={1000} />
      <ShootingStar delay={5000} />
      <ShootingStar delay={9000} />
      <ShootingStar delay={14000} />

      {/* Forest at bottom */}
      <View style={{ position: "absolute", bottom: 20, left: 0, right: 0, height: 160, zIndex: 1 }}>
        {trees.map((tree, i) => (
          <View key={i} style={{ position: "absolute", left: tree.x, bottom: 0 }}>
            <DetailedPineTree height={tree.height} shade={tree.shade} />
          </View>
        ))}
      </View>

      {/* Ground */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 25,
        backgroundColor: "#152515",
        zIndex: 2,
      }} />

      {/* Fire glow */}
      <Animated.View style={{
        position: "absolute",
        bottom: 15,
        left: "50%",
        marginLeft: -70,
        width: 140,
        height: 40,
        backgroundColor: "#FF6B35",
        borderRadius: 70,
        opacity: 0.2,
        zIndex: 2,
      }} />

      {/* Campfire */}
      <View style={{ position: "absolute", bottom: 12, left: "50%", marginLeft: -40, zIndex: 3 }}>
        <DetailedCampfire size={80} />
      </View>

      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ padding: 18, paddingTop: 60, paddingBottom: 200 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={MUTED}
          />
        }
      >
        {/* Title with pixel fire */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <SmallFireIcon size={28} />
          <View style={{ width: 10 }} />
          <Text style={{
            color: TEXT,
            fontSize: 30,
            fontWeight: "900",
            textShadowColor: "#FF6B35",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
          }}>
            Your Circles
          </Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>
          Gather 'round the fire with friends
        </Text>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <PixelSparkle size={18} />
            <View style={{ width: 8 }} />
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>
              Create a new circle
            </Text>
          </View>
          <Input placeholder="Circle name" value={newName} onChangeText={setNewName} />
          <View style={{ height: 10 }} />
          <Button title={loading ? "..." : "Create Circle"} onPress={createGroup} disabled={!canCreate || loading} />

          <View style={{ height: 20, borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 12 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <PixelTentIcon size={22} />
            <View style={{ width: 8 }} />
            <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>
              Join by invite code
            </Text>
          </View>
          <Input placeholder="Paste invite code" value={joinId} onChangeText={setJoinId} />
          <View style={{ height: 10 }} />
          <Button title={loading ? "..." : "Join Circle"} onPress={joinGroup} disabled={!canJoin || loading} />
        </Card>

        <View style={{ height: 8 }} />
        <Button title={loading ? "Refreshing..." : "Refresh"} variant="outline" onPress={refresh} disabled={loading} />
        <View style={{ height: 20 }} />

        {groups.length > 0 && (
          <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600", marginBottom: 10, letterSpacing: 1.5 }}>
            YOUR CIRCLES
          </Text>
        )}

        {groups.map((g) => (
          <Pressable key={g.id} onPress={() => openGroup(g.id)} disabled={loading}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <PixelTentIcon size={28} />
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800" }}>
                    {g.name ?? "(untitled)"}
                  </Text>
                  <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
                    Tap to enter
                  </Text>
                </View>
                <PixelArrow size={16} />
              </View>
            </Card>
          </Pressable>
        ))}

        {groups.length === 0 && !loading && (
          <Card>
            <Text style={{ color: MUTED, fontSize: 14, textAlign: "center", fontStyle: "italic" }}>
              No circles yet. Create one or join with an invite code!
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Congrats Modal */}
      <Modal
        visible={showCongratsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCongratsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}>
          <View style={{
            backgroundColor: CARD,
            borderColor: BORDER,
            borderWidth: 2,
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 340,
            alignItems: "center",
          }}>
            <PixelCheckmark size={60} />

            <Text style={{
              color: TEXT,
              fontSize: 26,
              fontWeight: "900",
              marginTop: 16,
              textAlign: "center",
            }}>
              Circle Created!
            </Text>

            <Text style={{
              color: MUTED,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}>
              Share this code with friends to invite them
            </Text>

            {/* Code Display */}
            <View style={{
              backgroundColor: "rgba(10, 16, 32, 0.9)",
              borderColor: BTN,
              borderWidth: 2,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginTop: 20,
              width: "100%",
              alignItems: "center",
            }}>
              <Text style={{
                color: TEXT,
                fontSize: 32,
                fontWeight: "900",
                letterSpacing: 4,
                fontFamily: "monospace",
              }}>
                {createdGroup?.code}
              </Text>
            </View>

            {/* Buttons Row */}
            <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>
              <Pressable
                onPress={copyCode}
                style={{
                  flex: 1,
                  backgroundColor: codeCopied ? "#4ADE80" : "transparent",
                  borderColor: codeCopied ? "#4ADE80" : BORDER,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <PixelCopyIcon size={18} />
                <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                  {codeCopied ? "Copied!" : "Copy"}
                </Text>
              </Pressable>

              <Pressable
                onPress={shareCode}
                style={{
                  flex: 1,
                  backgroundColor: BTN,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <PixelShareIcon size={18} />
                <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                  Share
                </Text>
              </Pressable>
            </View>

            {/* Enter Circle Button */}
            <Pressable
              onPress={closeCongratsAndNavigate}
              style={{
                marginTop: 16,
                width: "100%",
                backgroundColor: "transparent",
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                Enter Circle
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
