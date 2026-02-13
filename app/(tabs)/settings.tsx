import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View, Switch, Dimensions, ScrollView, Modal } from "react-native";
import { supabase } from "../../lib/supabase";
import { registerPushToken } from "../../lib/services/pushService";
import { getUserEmojis, updateUserEmojis, UserEmojis, DEFAULT_EMOJIS } from "../../lib/services/reactionService";
import { useProfile } from "../../lib/hooks/useProfile";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "../../components/PixelCharacter";
import { NightSky } from "../../components/sky";
import { PixelTitle } from "../../components/PixelTitle";
import { CampfireColors, Spacing, Radii, Typography, Shadows } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const { BG, TEXT_CREAM: TEXT, MUTED, BTN_PRIMARY: BTN, BORDER, INPUT_BG_DARK: INPUT_BG, CARD_SOLID: CARD, SUCCESS, DANGER, DANGER_BORDER } = CampfireColors;

// Simple tree for settings background
function Tree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const color = `rgba(12, ${25 + shade * 10}, ${18 + shade * 6}, 1)`;
  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.35, borderRightWidth: height * 0.35, borderBottomWidth: height * 0.3, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -5 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.45, borderRightWidth: height * 0.45, borderBottomWidth: height * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -7 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.55, borderRightWidth: height * 0.55, borderBottomWidth: height * 0.4, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }} />
      <View style={{ width: height * 0.1, height: height * 0.12, backgroundColor: `rgba(35, ${20 + shade * 5}, 12, 1)` }} />
    </View>
  );
}

// Pixel gear icon for title
function PixelGearIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.4, height: size * 0.4, backgroundColor: TEXT, borderRadius: size * 0.2, position: "absolute" }} />
      <View style={{ width: size * 0.18, height: size * 0.85, backgroundColor: TEXT, position: "absolute" }} />
      <View style={{ width: size * 0.85, height: size * 0.18, backgroundColor: TEXT, position: "absolute" }} />
      <View style={{ width: size * 0.18, height: size * 0.6, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "45deg" }] }} />
      <View style={{ width: size * 0.6, height: size * 0.18, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "45deg" }] }} />
      <View style={{ width: size * 0.15, height: size * 0.15, backgroundColor: BG, borderRadius: size * 0.075, position: "absolute" }} />
    </View>
  );
}

function PixelBellIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.7, height: size * 0.6, backgroundColor: "#FFD93D", borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, marginTop: size * 0.1 }} />
      <View style={{ width: size * 0.85, height: size * 0.12, backgroundColor: "#FFD93D", borderRadius: size * 0.06 }} />
      <View style={{ width: size * 0.15, height: size * 0.15, backgroundColor: "#FFD93D", borderRadius: size * 0.075, marginTop: size * 0.02 }} />
    </View>
  );
}

function PixelPencilIcon({ size = 16 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.25, height: size * 0.7, backgroundColor: "#FFD93D", transform: [{ rotate: "-45deg" }] }} />
      <View style={{ position: "absolute", bottom: size * 0.1, left: size * 0.15, width: 0, height: 0, borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderTopWidth: size * 0.2, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#1a1a1a", transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

function PixelDoorIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.6, height: size * 0.85, backgroundColor: "#78350F", borderRadius: size * 0.05 }}>
        <View style={{ position: "absolute", right: size * 0.1, top: size * 0.35, width: size * 0.1, height: size * 0.1, backgroundColor: "#EAB308", borderRadius: size * 0.05 }} />
      </View>
      <View style={{ position: "absolute", right: 0, top: size * 0.3, width: size * 0.3, height: size * 0.1, backgroundColor: TEXT }} />
      <View style={{ position: "absolute", right: 0, width: 0, height: 0, borderTopWidth: size * 0.15, borderBottomWidth: size * 0.15, borderLeftWidth: size * 0.15, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: TEXT, top: size * 0.2 }} />
    </View>
  );
}

// Common emoji options for picker
const emojiOptions = [
  '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDD25', '\uD83D\uDE2E', '\uD83D\uDC4F', '\uD83D\uDE0D', '\uD83E\uDD7A', '\uD83D\uDE2D',
  '\uD83D\uDE4C', '\uD83D\uDC80', '\uD83E\uDD23', '\uD83D\uDE0A', '\uD83E\uDD70', '\uD83D\uDE0E', '\uD83E\uDD14', '\uD83D\uDC40',
  '\uD83D\uDCAF', '\u2728', '\uD83C\uDF89', '\uD83D\uDC4D', '\uD83D\uDCAA', '\uD83D\uDE4F', '\uD83D\uDE05', '\uD83E\uDD2F',
  '\uD83E\uDEF6', '\uD83D\uDE08', '\uD83E\uDD21', '\uD83D\uDC85', '\uD83E\uDD73', '\uD83D\uDE34', '\uD83E\uDD2E', '\uD83E\uDEE3',
  '\uD83E\uDD2D', '\uD83D\uDE31', '\uD83E\uDD75', '\uD83E\uDD76', '\uD83D\uDC7B', '\uD83D\uDCA9', '\uD83E\uDD20', '\uD83E\uDD84',
  '\uD83C\uDF08', '\u2B50', '\uD83D\uDCAB', '\uD83C\uDF19', '\u2600\uFE0F', '\uD83C\uDF38', '\uD83C\uDF55', '\uD83C\uDF7A',
  '\uD83C\uDFB8', '\uD83C\uDFAE', '\u26BD', '\uD83C\uDFC6', '\uD83D\uDC8E', '\uD83D\uDD2E', '\uD83C\uDFAD', '\uD83E\uDD8B',
];

const trees = [
  { x: -15, height: 80, shade: 0 },
  { x: 20, height: 55, shade: 1 },
  { x: SCREEN_WIDTH - 70, height: 65, shade: 1 },
  { x: SCREEN_WIDTH - 25, height: 95, shade: 0 },
];

export default function Settings() {
  const { data: profile, refetch: refetchProfile } = useProfile();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || "");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmojis, setUserEmojis] = useState<UserEmojis>(DEFAULT_EMOJIS);
  const [editingEmojiSlot, setEditingEmojiSlot] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sync username field when profile loads
  useEffect(() => {
    if (profile?.username) setNewUsername(profile.username);
  }, [profile?.username]);

  const handleEmojiSelect = async (emoji: string) => {
    if (editingEmojiSlot === null) return;

    const slotKey = `emoji_slot_${editingEmojiSlot}` as keyof UserEmojis;
    const updatedEmojis = await updateUserEmojis({ [slotKey]: emoji });
    setUserEmojis(updatedEmojis);
    setShowEmojiPicker(false);
    setEditingEmojiSlot(null);
  };

  useEffect(() => {
    // Load session email and emojis
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user?.email ?? null);
      setUserId(data.session?.user?.id ?? null);
      const emojis = await getUserEmojis();
      setUserEmojis(emojis);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        refetchProfile();
        if (!pushToken) handleRegisterPush();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleRegisterPush = async () => {
    setRegisteringPush(true);
    try {
      const token = await registerPushToken();
      if (token) { setPushToken(token); setPushEnabled(true); } else { setPushEnabled(false); }
    } catch (e: any) {
      console.error("Push registration failed:", e);
    } finally {
      setRegisteringPush(false);
    }
  };

  const togglePush = async (value: boolean) => {
    if (value && !pushToken) await handleRegisterPush();
    else setPushEnabled(value);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out failed", error.message);
    else {
      setSessionEmail(null); setUserId(null);
      setPushToken(null); setPushEnabled(false);
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim()) { Alert.alert("Error", "Username cannot be empty"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      refetchProfile();
      setEditingUsername(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!sessionEmail && !userId) {
      const timer = setTimeout(() => { router.replace("/login"); }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionEmail, userId]);

  const renderLoggedOutView = () => (
    <View style={{ alignItems: "center", marginBottom: 30, marginTop: 20 }}>
      <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 20, marginBottom: 8 }}>
        Loading...
      </Text>
    </View>
  );

  const renderLoggedInView = () => (
    <>
      {/* Profile Card */}
      <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: 14 }}>
        <Text style={{ color: TEXT, ...Typography.heading3, marginBottom: Spacing.lg }}>My Profile</Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
          <View style={{ marginRight: Spacing.lg }}>
            <PixelCharacter config={profile?.avatar_config || DEFAULT_CHARACTER} size={70} />
          </View>

          <View style={{ flex: 1 }}>
            {editingUsername ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Username"
                  placeholderTextColor={"#6B5B4F"}
                  accessibilityLabel="Edit username"
                  style={{ flex: 1, backgroundColor: INPUT_BG, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.sm, padding: 10, color: TEXT, marginRight: 8 }}
                  maxLength={20}
                />
                <Pressable
                  onPress={saveUsername}
                  disabled={saving}
                  style={{ backgroundColor: SUCCESS, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.sm, minWidth: 44, minHeight: 44, justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Save username"
                >
                  <Text style={{ color: "#000", fontFamily: "Retro", fontSize: 12 }}>{saving ? "..." : "Save"}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 18 }}>{profile?.username || "No username"}</Text>
                <Pressable onPress={() => setEditingUsername(true)} style={{ marginLeft: 8, padding: 4, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }} accessibilityRole="button" accessibilityLabel="Edit username">
                  <PixelPencilIcon size={14} />
                </Pressable>
              </View>
            )}

            <Text style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>{sessionEmail}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <View style={{ width: 8, height: 8, backgroundColor: CampfireColors.WARNING, borderRadius: 4, marginRight: 6 }} />
              <Text style={{ color: CampfireColors.WARNING, fontSize: 13, fontFamily: "Retro" }}>{profile?.total_points || 0} points</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/create-character")}
          style={{ borderColor: BORDER, borderWidth: 1, borderRadius: Radii.md, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", minHeight: 44 }}
          accessibilityRole="button"
          accessibilityLabel="Edit Avatar"
        >
          <PixelPencilIcon size={16} />
          <Text style={{ color: TEXT, fontFamily: "Retro", marginLeft: 8 }}>Edit Avatar</Text>
        </Pressable>
      </View>

      {/* Push Notifications */}
      <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <PixelBellIcon size={22} />
          <View style={{ width: 10 }} />
          <Text style={{ color: TEXT, ...Typography.heading3 }}>Notifications</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: MUTED }}>{registeringPush ? "Registering..." : pushEnabled ? "Enabled" : "Disabled"}</Text>
          <Switch value={pushEnabled} onValueChange={togglePush} disabled={registeringPush} trackColor={{ false: BORDER, true: SUCCESS }} thumbColor={pushEnabled ? "#fff" : "#f4f3f4"} />
        </View>

        {pushToken && (
          <Text style={{ color: MUTED, fontSize: 10, opacity: 0.5 }} numberOfLines={1}>Token: {pushToken.slice(0, 30)}...</Text>
        )}

        {!pushEnabled && !registeringPush && (
          <Pressable
            onPress={handleRegisterPush}
            style={{ borderColor: BORDER, borderWidth: 1, borderRadius: Radii.md, paddingVertical: 12, alignItems: "center", marginTop: 10, minHeight: 44 }}
            accessibilityRole="button"
            accessibilityLabel="Enable Notifications"
          >
            <Text style={{ color: TEXT, ...Typography.heading3 }}>Enable Notifications</Text>
          </Pressable>
        )}
      </View>

      {/* Reaction Emojis */}
      <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: 14 }}>
        <Text style={{ color: TEXT, ...Typography.heading3, marginBottom: Spacing.sm }}>Reaction Emojis</Text>
        <Text style={{ color: MUTED, fontSize: 13, marginBottom: Spacing.lg }}>Customize your quick reactions for Fireside</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {[1, 2, 3, 4].map((slot) => {
            const slotKey = `emoji_slot_${slot}` as keyof UserEmojis;
            return (
              <Pressable
                key={slot}
                onPress={() => { setEditingEmojiSlot(slot); setShowEmojiPicker(true); }}
                style={{
                  width: 56, height: 56,
                  backgroundColor: INPUT_BG, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.md,
                  alignItems: "center", justifyContent: "center",
                  minWidth: 44, minHeight: 44,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Change emoji slot ${slot}`}
              >
                <Text style={{ fontSize: 28 }}>{userEmojis[slotKey]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ color: MUTED, fontSize: 11, textAlign: "center", marginTop: 12 }}>Tap to change</Text>
      </View>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} transparent animationType="fade" onRequestClose={() => setShowEmojiPicker(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={{ backgroundColor: CARD, borderRadius: Radii.modal, padding: Spacing.xl, width: "85%", maxWidth: 320 }}>
            <Text style={{ color: TEXT, ...Typography.heading2, fontSize: 18, textAlign: "center", marginBottom: Spacing.lg }}>Choose an Emoji</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {emojiOptions.map((emoji, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleEmojiSelect(emoji)}
                  style={{
                    width: 50, height: 50,
                    backgroundColor: INPUT_BG, borderRadius: Radii.md,
                    alignItems: "center", justifyContent: "center",
                    minWidth: 44, minHeight: 44,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select emoji ${emoji}`}
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowEmojiPicker(false)}
              style={{ marginTop: Spacing.lg, paddingVertical: 12, alignItems: "center", minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={{ color: MUTED, fontFamily: "Retro" }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Sign Out */}
      <Pressable
        onPress={signOut}
        style={{
          backgroundColor: CARD, borderColor: DANGER_BORDER, borderWidth: 1, borderRadius: Radii.lg,
          paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center",
          minHeight: 44,
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign Out"
      >
        <PixelDoorIcon size={20} />
        <Text style={{ color: DANGER, ...Typography.heading3, marginLeft: 10 }}>Sign Out</Text>
      </Pressable>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Shared sky */}
      <NightSky density="minimal" showMoon showShootingStars showFireflies={false} showGradient={false} moonBgColor={BG} />

      {/* Forest */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, zIndex: 1 }}>
        {trees.map((tree, i) => (
          <Tree key={i} x={tree.x} height={tree.height} shade={tree.shade} />
        ))}
      </View>

      {/* Ground */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 20, backgroundColor: CampfireColors.GROUND_DEEP, zIndex: 2 }} />

      <ScrollView style={{ flex: 1, zIndex: 10 }} contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 160 }}>
        {/* Title */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm, marginTop: 30 }}>
          <PixelGearIcon size={28} />
          <View style={{ width: 10 }} />
          <PixelTitle fontSize={26}>Settings</PixelTitle>
        </View>

        {sessionEmail ? renderLoggedInView() : renderLoggedOutView()}
      </ScrollView>
    </View>
  );
}
