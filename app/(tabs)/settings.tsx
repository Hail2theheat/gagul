import { router } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { Alert, Pressable, Text, TextInput, View, Switch, Animated, Dimensions, ScrollView } from "react-native";
import { supabase } from "../../lib/supabase";
import { registerPushToken } from "../../lib/services/pushService";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "../../components/PixelCharacter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Colors - cozy forest theme
const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#FF6B35";
const INPUT_BG = "rgba(10, 16, 32, 0.8)";
const SUCCESS = "#4ADE80";
const DANGER = "#FCA5A5";
const DANGER_BORDER = "#7f1d1d";

// Pixel star component
function PixelStar({ x, y, size, delay, color = "#FFF" }: { x: number; y: number; size: number; delay: number; color?: string }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  if (size >= 3) {
    return (
      <Animated.View style={{ position: "absolute", left: x, top: y, opacity }}>
        <View style={{ width: size, height: size, backgroundColor: color, position: "absolute" }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: "absolute", top: -size * 0.4, left: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: "absolute", bottom: -size * 0.4, left: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: "absolute", left: -size * 0.4, top: size * 0.25 }} />
        <View style={{ width: size * 0.5, height: size * 0.5, backgroundColor: color, position: "absolute", right: -size * 0.4, top: size * 0.25 }} />
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
        shadowColor: color,
        shadowOpacity: 0.8,
        shadowRadius: size * 2,
      }}
    />
  );
}

// Shooting star
function ShootingStar({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const startY = useRef(40 + Math.random() * 100).current;
  const startX = useRef(40 + Math.random() * (SCREEN_WIDTH * 0.5)).current;

  useEffect(() => {
    const animate = () => {
      setVisible(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setTimeout(animate, 6000 + Math.random() * 10000);
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
        width: 4,
        height: 4,
        backgroundColor: "#FFF",
        borderRadius: 2,
        opacity: progress.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 95] }) },
        ],
        shadowColor: "#FFF",
        shadowOffset: { width: -8, height: -5 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
      }}
    />
  );
}

// Crescent moon
function PixelMoon() {
  return (
    <View style={{ position: "absolute", top: 50, right: 30 }}>
      <View style={{
        width: 45,
        height: 45,
        backgroundColor: "#FFFACD",
        borderRadius: 22.5,
        shadowColor: "#FFFACD",
        shadowOpacity: 0.5,
        shadowRadius: 18,
      }}>
        <View style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 40,
          height: 40,
          backgroundColor: BG,
          borderRadius: 20,
        }} />
        <View style={{ position: "absolute", top: 12, left: 7, width: 5, height: 5, backgroundColor: "#EEE8AA", borderRadius: 2.5, opacity: 0.4 }} />
        <View style={{ position: "absolute", top: 25, left: 12, width: 4, height: 4, backgroundColor: "#EEE8AA", borderRadius: 2, opacity: 0.3 }} />
      </View>
    </View>
  );
}

// Pine tree
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

// Pixel bell icon
function PixelBellIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.7, height: size * 0.6, backgroundColor: "#FFD93D", borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, marginTop: size * 0.1 }} />
      <View style={{ width: size * 0.85, height: size * 0.12, backgroundColor: "#FFD93D", borderRadius: size * 0.06 }} />
      <View style={{ width: size * 0.15, height: size * 0.15, backgroundColor: "#FFD93D", borderRadius: size * 0.075, marginTop: size * 0.02 }} />
    </View>
  );
}

// Pixel pencil icon
function PixelPencilIcon({ size = 16 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.25, height: size * 0.7, backgroundColor: "#FFD93D", transform: [{ rotate: "-45deg" }] }} />
      <View style={{ position: "absolute", bottom: size * 0.1, left: size * 0.15, width: 0, height: 0, borderLeftWidth: size * 0.12, borderRightWidth: size * 0.12, borderTopWidth: size * 0.2, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#1a1a1a", transform: [{ rotate: "-45deg" }] }} />
    </View>
  );
}

// Pixel door/logout icon
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

interface Profile {
  id: string;
  username: string | null;
  avatar_config: CharacterConfig | null;
  total_points: number;
}

export default function Settings() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [saving, setSaving] = useState(false);

  const stars = [
    { x: 25, y: 60, size: 3, delay: 0, color: "#FFF" },
    { x: 90, y: 90, size: 2, delay: 200, color: "#FFFACD" },
    { x: 150, y: 45, size: 4, delay: 400, color: "#FFF" },
    { x: 60, y: 130, size: 2, delay: 100, color: "#E6E6FA" },
    { x: 200, y: 70, size: 2, delay: 300, color: "#FFF" },
    { x: 130, y: 110, size: 3, delay: 500, color: "#FFF" },
    { x: 40, y: 170, size: 1, delay: 150, color: "#FFF" },
    { x: 100, y: 150, size: 2, delay: 350, color: "#FFFACD" },
    { x: 170, y: 130, size: 1, delay: 550, color: "#FFF" },
    { x: 220, y: 100, size: 2, delay: 250, color: "#E6E6FA" },
  ];

  const trees = [
    { x: -15, height: 80, shade: 0 },
    { x: 20, height: 55, shade: 1 },
    { x: SCREEN_WIDTH - 70, height: 65, shade: 1 },
    { x: SCREEN_WIDTH - 25, height: 95, shade: 0 },
  ];

  async function refreshSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) Alert.alert("Session error", error.message);
    setSessionEmail(data.session?.user?.email ?? null);
    setUserId(data.session?.user?.id ?? null);

    if (data.session?.user) {
      fetchProfile(data.session.user.id);
    } else {
      setProfile(null);
    }
  }

  async function fetchProfile(uid: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (!error && data) {
      setProfile(data);
      setNewUsername(data.username || "");
    }
  }

  useEffect(() => {
    refreshSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (!pushToken) {
          handleRegisterPush();
        }
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleRegisterPush = async () => {
    setRegisteringPush(true);
    try {
      const token = await registerPushToken();
      if (token) {
        setPushToken(token);
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    } catch (e: any) {
      console.error("Push registration failed:", e);
    } finally {
      setRegisteringPush(false);
    }
  };

  const togglePush = async (value: boolean) => {
    if (value && !pushToken) {
      await handleRegisterPush();
    } else {
      setPushEnabled(value);
    }
  };

  const signIn = async () => {
    if (!email.trim() || !password) return Alert.alert("Missing", "Email + password required");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      Alert.alert("Sign in failed", error.message);
    } else {
      setEmail("");
      setPassword("");
      await refreshSession();
      await handleRegisterPush();

      // Check if user has profile with username
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        if (!profileData?.username) {
          router.replace("/create-character");
        }
      }
    }
  };

  const signUp = async () => {
    if (!email.trim() || !password) return Alert.alert("Missing", "Email + password required");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      Alert.alert("Sign up failed", error.message);
    } else {
      setEmail("");
      setPassword("");
      // For email confirmation flow
      if (data.session) {
        // Auto-confirmed, go to character creation
        router.replace("/create-character");
      } else {
        Alert.alert("Check your email", "Please confirm your email address, then sign in.");
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out failed", error.message);
    else {
      setSessionEmail(null);
      setUserId(null);
      setProfile(null);
      setPushToken(null);
      setPushEnabled(false);
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username: newUsername.trim() } : null);
      setEditingUsername(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  // Redirect to login if not logged in
  useEffect(() => {
    if (!sessionEmail && !userId) {
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionEmail, userId]);

  const renderLoggedOutView = () => (
    <View style={{ alignItems: "center", marginBottom: 30, marginTop: 20 }}>
      <Text style={{ color: TEXT, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
        Loading...
      </Text>
    </View>
  );

  const renderLoggedInView = () => (
    <>
      {/* Profile Card */}
      <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <Text style={{ color: TEXT, fontWeight: "700", fontSize: 16, marginBottom: 16 }}>My Profile</Text>

        {/* Avatar and Info */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          {/* Avatar */}
          <View style={{ marginRight: 16 }}>
            <PixelCharacter
              config={profile?.avatar_config || DEFAULT_CHARACTER}
              size={70}
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            {editingUsername ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Username"
                  placeholderTextColor={"#6B5B4F"}
                  style={{ flex: 1, backgroundColor: INPUT_BG, borderColor: BORDER, borderWidth: 1, borderRadius: 8, padding: 10, color: TEXT, marginRight: 8 }}
                  maxLength={20}
                />
                <Pressable
                  onPress={saveUsername}
                  disabled={saving}
                  style={{ backgroundColor: SUCCESS, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: "#000", fontWeight: "700", fontSize: 12 }}>
                    {saving ? "..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                  {profile?.username || "No username"}
                </Text>
                <Pressable onPress={() => setEditingUsername(true)} style={{ marginLeft: 8, padding: 4 }}>
                  <PixelPencilIcon size={14} />
                </Pressable>
              </View>
            )}

            <Text style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>
              {sessionEmail}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <View style={{ width: 8, height: 8, backgroundColor: "#EAB308", borderRadius: 4, marginRight: 6 }} />
              <Text style={{ color: "#EAB308", fontSize: 13, fontWeight: "600" }}>
                {profile?.total_points || 0} points
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Avatar Button */}
        <Pressable
          onPress={() => router.push("/create-character")}
          style={{
            borderColor: BORDER,
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <PixelPencilIcon size={16} />
          <Text style={{ color: TEXT, fontWeight: "600", marginLeft: 8 }}>Edit Avatar</Text>
        </Pressable>
      </View>

      {/* Push Notifications Card */}
      <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <PixelBellIcon size={22} />
          <View style={{ width: 10 }} />
          <Text style={{ color: TEXT, fontWeight: "700", fontSize: 16 }}>Notifications</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: MUTED }}>
            {registeringPush ? "Registering..." : pushEnabled ? "Enabled" : "Disabled"}
          </Text>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            disabled={registeringPush}
            trackColor={{ false: BORDER, true: SUCCESS }}
            thumbColor={pushEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>

        {pushToken && (
          <Text style={{ color: MUTED, fontSize: 10, opacity: 0.5 }} numberOfLines={1}>
            Token: {pushToken.slice(0, 30)}...
          </Text>
        )}

        {!pushEnabled && !registeringPush && (
          <Pressable
            onPress={handleRegisterPush}
            style={{ borderColor: BORDER, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 10 }}
          >
            <Text style={{ color: TEXT, fontWeight: "700" }}>Enable Notifications</Text>
          </Pressable>
        )}
      </View>

      {/* Sign Out */}
      <Pressable
        onPress={signOut}
        style={{
          backgroundColor: CARD,
          borderColor: DANGER_BORDER,
          borderWidth: 1,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <PixelDoorIcon size={20} />
        <Text style={{ color: DANGER, fontWeight: "700", marginLeft: 10 }}>Sign Out</Text>
      </Pressable>
    </>
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
      <ShootingStar delay={2000} />
      <ShootingStar delay={10000} />

      {/* Forest */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, zIndex: 1 }}>
        {trees.map((tree, i) => (
          <Tree key={i} x={tree.x} height={tree.height} shade={tree.shade} />
        ))}
      </View>

      {/* Ground */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 20, backgroundColor: "#152515", zIndex: 2 }} />

      <ScrollView style={{ flex: 1, zIndex: 10 }} contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>
        {/* Title */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 30 }}>
          <PixelGearIcon size={28} />
          <View style={{ width: 10 }} />
          <Text style={{
            color: TEXT,
            fontSize: 28,
            fontWeight: "900",
            textShadowColor: "#FF6B35",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
          }}>
            Settings
          </Text>
        </View>

        {/* Content based on auth state */}
        {sessionEmail ? renderLoggedInView() : renderLoggedOutView()}
      </ScrollView>
    </View>
  );
}
