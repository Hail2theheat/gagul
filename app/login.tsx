// app/login.tsx
import { router } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { PixelCharacter, DEFAULT_CHARACTER, CharacterConfig } from "../components/PixelCharacter";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Colors
const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#FF6B35";
const INPUT_BG = "rgba(10, 16, 32, 0.8)";

// Pixel star with twinkle
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

// Crescent moon
function PixelMoon() {
  return (
    <View style={{ position: "absolute", top: 60, right: 40 }}>
      <View style={{
        width: 50,
        height: 50,
        backgroundColor: "#FFFACD",
        borderRadius: 25,
        shadowColor: "#FFFACD",
        shadowOpacity: 0.6,
        shadowRadius: 20,
      }}>
        <View style={{
          position: "absolute",
          top: -5,
          right: -5,
          width: 45,
          height: 45,
          backgroundColor: BG,
          borderRadius: 22.5,
        }} />
        <View style={{ position: "absolute", top: 15, left: 8, width: 6, height: 6, backgroundColor: "#EEE8AA", borderRadius: 3, opacity: 0.5 }} />
        <View style={{ position: "absolute", top: 28, left: 15, width: 4, height: 4, backgroundColor: "#EEE8AA", borderRadius: 2, opacity: 0.4 }} />
      </View>
    </View>
  );
}

// Pine tree
function Tree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const color = `rgba(12, ${25 + shade * 10}, ${18 + shade * 6}, 1)`;
  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.35, borderRightWidth: height * 0.35, borderBottomWidth: height * 0.3, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -6 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.45, borderRightWidth: height * 0.45, borderBottomWidth: height * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -8 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.55, borderRightWidth: height * 0.55, borderBottomWidth: height * 0.4, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }} />
      <View style={{ width: height * 0.12, height: height * 0.15, backgroundColor: `rgba(35, ${20 + shade * 5}, 12, 1)` }} />
    </View>
  );
}

// Large campfire for login screen
function LargeCampfire() {
  const flicker1 = useRef(new Animated.Value(0)).current;
  const flicker2 = useRef(new Animated.Value(0)).current;
  const flicker3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flicker1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(flicker1, { toValue: 0, duration: 250, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flicker2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(flicker2, { toValue: 0, duration: 200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flicker3, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(flicker3, { toValue: 0, duration: 280, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const px = 4; // Pixel size

  return (
    <View style={{ alignItems: "center", marginBottom: 20 }}>
      {/* Fire glow */}
      <View style={{
        position: "absolute",
        bottom: 10,
        width: 120,
        height: 60,
        backgroundColor: "#FF6B35",
        borderRadius: 60,
        opacity: 0.3,
      }} />

      {/* Flames */}
      <View style={{ alignItems: "center", marginBottom: -10 }}>
        {/* Left flame */}
        <Animated.View style={{
          position: "absolute",
          left: -px * 8,
          bottom: 0,
          width: px * 5,
          height: px * 14,
          backgroundColor: "#FF4500",
          transform: [
            { scaleY: flicker1.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) },
            { rotate: "-8deg" }
          ],
        }}>
          <View style={{ position: "absolute", bottom: 0, left: px * 0.75, width: px * 3.5, height: px * 10, backgroundColor: "#FF6B35" }} />
          <View style={{ position: "absolute", bottom: 0, left: px * 1.25, width: px * 2.5, height: px * 6, backgroundColor: "#FFD93D" }} />
        </Animated.View>

        {/* Center flame */}
        <Animated.View style={{
          width: px * 7,
          height: px * 20,
          backgroundColor: "#FF4500",
          transform: [{ scaleY: flicker2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        }}>
          <View style={{ position: "absolute", bottom: 0, left: px * 0.75, width: px * 5.5, height: px * 15, backgroundColor: "#FF6B35" }} />
          <View style={{ position: "absolute", bottom: 0, left: px * 1.5, width: px * 4, height: px * 10, backgroundColor: "#FFD93D" }} />
          <View style={{ position: "absolute", bottom: 0, left: px * 2, width: px * 3, height: px * 5, backgroundColor: "#FFFACD" }} />
        </Animated.View>

        {/* Right flame */}
        <Animated.View style={{
          position: "absolute",
          right: -px * 8,
          bottom: 0,
          width: px * 5,
          height: px * 12,
          backgroundColor: "#FF4500",
          transform: [
            { scaleY: flicker3.interpolate({ inputRange: [0, 1], outputRange: [1.05, 0.9] }) },
            { rotate: "8deg" }
          ],
        }}>
          <View style={{ position: "absolute", bottom: 0, left: px * 0.75, width: px * 3.5, height: px * 9, backgroundColor: "#FF6B35" }} />
          <View style={{ position: "absolute", bottom: 0, left: px * 1.25, width: px * 2.5, height: px * 5, backgroundColor: "#FFD93D" }} />
        </Animated.View>

        {/* Embers */}
        <Animated.View style={{
          position: "absolute",
          bottom: px * 18,
          left: px * 4,
          width: px,
          height: px,
          backgroundColor: "#FFD93D",
          opacity: flicker1.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        }} />
        <Animated.View style={{
          position: "absolute",
          bottom: px * 22,
          right: px * 5,
          width: px,
          height: px,
          backgroundColor: "#FF8C00",
          opacity: flicker2.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
        }} />
      </View>

      {/* Logs */}
      <View style={{ flexDirection: "row", marginTop: px * 2 }}>
        <View style={{ width: px * 14, height: px * 3, backgroundColor: "#5C3D2E", transform: [{ rotate: "-15deg" }], marginRight: -px * 4 }} />
        <View style={{ width: px * 14, height: px * 3, backgroundColor: "#4A2F23", transform: [{ rotate: "15deg" }], marginLeft: -px * 4 }} />
      </View>
      <View style={{ width: px * 10, height: px * 2.5, backgroundColor: "#6B4535", marginTop: -px * 2 }} />

      {/* Rocks */}
      <View style={{ flexDirection: "row", marginTop: px }}>
        <View style={{ width: px * 4, height: px * 3, backgroundColor: "#4a4a52", marginRight: px }} />
        <View style={{ width: px * 3, height: px * 4, backgroundColor: "#5a5a62", marginRight: px * 8 }} />
        <View style={{ width: px * 3, height: px * 4, backgroundColor: "#5a5a62", marginRight: px }} />
        <View style={{ width: px * 4, height: px * 3, backgroundColor: "#4a4a52" }} />
      </View>
    </View>
  );
}

// Sitting character around fire
function SittingCharacter({ config, position, flip }: { config: CharacterConfig; position: "left" | "right"; flip?: boolean }) {
  return (
    <View style={{
      position: "absolute",
      bottom: 0,
      left: position === "left" ? 20 : undefined,
      right: position === "right" ? 20 : undefined,
      transform: [{ scaleX: flip ? -1 : 1 }],
    }}>
      <PixelCharacter config={config} size={36} />
    </View>
  );
}

// Random character configs for the campfire scene
const CHARACTER_CONFIGS: CharacterConfig[] = [
  { skinTone: "light", hairStyle: "short", hairColor: "brown", shirtColor: "blue", shirtStyle: "tshirt", pantsColor: "black", pantsStyle: "jeans", shoeColor: "black", accessory: "none" },
  { skinTone: "brown", hairStyle: "afro", hairColor: "black", shirtColor: "red", shirtStyle: "tshirt", pantsColor: "black", pantsStyle: "jeans", shoeColor: "black", accessory: "none" },
  { skinTone: "tan", hairStyle: "long", hairColor: "blonde", shirtColor: "green", shirtStyle: "tshirt", pantsColor: "gray", pantsStyle: "jeans", shoeColor: "brown", accessory: "none" },
];

export default function LoginScreen() {
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation for title
  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(titleGlow, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const stars = [
    { x: 30, y: 80, size: 3, delay: 0, color: "#FFF" },
    { x: 100, y: 120, size: 2, delay: 200, color: "#FFFACD" },
    { x: 180, y: 60, size: 4, delay: 400, color: "#FFF" },
    { x: 250, y: 100, size: 2, delay: 100, color: "#E6E6FA" },
    { x: 320, y: 70, size: 3, delay: 300, color: "#FFF" },
    { x: 60, y: 150, size: 2, delay: 500, color: "#FFF" },
    { x: 140, y: 90, size: 2, delay: 150, color: "#FFFACD" },
    { x: 220, y: 140, size: 1, delay: 350, color: "#FFF" },
    { x: 290, y: 130, size: 2, delay: 550, color: "#E6E6FA" },
    { x: 350, y: 110, size: 1, delay: 250, color: "#FFF" },
    { x: 80, y: 180, size: 2, delay: 450, color: "#FFF" },
    { x: 160, y: 170, size: 1, delay: 650, color: "#FFFACD" },
  ];

  const trees = [
    { x: -20, height: 100, shade: 0 },
    { x: 15, height: 70, shade: 1 },
    { x: 50, height: 120, shade: 0 },
    { x: SCREEN_WIDTH - 90, height: 110, shade: 0 },
    { x: SCREEN_WIDTH - 50, height: 75, shade: 1 },
    { x: SCREEN_WIDTH - 10, height: 95, shade: 0 },
  ];

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // Check if user has profile
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .single();

        if (!profile?.username) {
          router.replace("/create-character");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (e: any) {
      Alert.alert("Sign in failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (data.session) {
        // Auto-confirmed, go to character creation
        router.replace("/create-character");
      } else {
        Alert.alert("Check your email", "Please confirm your email address, then sign in.");
        setMode("login");
      }
    } catch (e: any) {
      Alert.alert("Sign up failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      {/* Title */}
      <Animated.Text style={{
        fontSize: 52,
        fontWeight: "900",
        color: TEXT,
        marginBottom: 8,
        textShadowColor: titleGlow.interpolate({
          inputRange: [0, 1],
          outputRange: ["rgba(255, 107, 53, 0.5)", "rgba(255, 107, 53, 1)"],
        }),
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
      }}>
        STOKIE
      </Animated.Text>

      <Text style={{ color: MUTED, fontSize: 16, marginBottom: 40, textAlign: "center" }}>
        Gather 'round the fire with friends
      </Text>

      {/* Campfire scene */}
      <View style={{ height: 160, width: "100%", alignItems: "center", justifyContent: "flex-end", marginBottom: 40 }}>
        <LargeCampfire />
        <SittingCharacter config={CHARACTER_CONFIGS[0]} position="left" />
        <SittingCharacter config={CHARACTER_CONFIGS[1]} position="right" flip />
      </View>

      {/* Buttons */}
      <Pressable
        onPress={() => setMode("login")}
        style={{
          backgroundColor: BTN,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 48,
          width: "100%",
          maxWidth: 280,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: TEXT, fontWeight: "800", fontSize: 18, textAlign: "center" }}>
          Sign In
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setMode("signup")}
        style={{
          backgroundColor: "transparent",
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 48,
          width: "100%",
          maxWidth: 280,
        }}
      >
        <Text style={{ color: TEXT, fontWeight: "700", fontSize: 18, textAlign: "center" }}>
          Create Account
        </Text>
      </Pressable>
    </View>
  );

  const renderAuthForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable
          onPress={() => setMode("welcome")}
          style={{ position: "absolute", top: 60, left: 24, padding: 8 }}
        >
          <Text style={{ color: MUTED, fontSize: 16 }}>Back</Text>
        </Pressable>

        {/* Title */}
        <Text style={{
          fontSize: 36,
          fontWeight: "900",
          color: TEXT,
          textAlign: "center",
          marginBottom: 8,
          textShadowColor: "#FF6B35",
          textShadowRadius: 10,
        }}>
          STOKIE
        </Text>

        <Text style={{ color: MUTED, fontSize: 16, textAlign: "center", marginBottom: 40 }}>
          {mode === "login" ? "Welcome back, friend" : "Join the circle"}
        </Text>

        {/* Form */}
        <View style={{
          backgroundColor: CARD,
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 20,
          padding: 20,
          width: "100%",
          maxWidth: 340,
          alignSelf: "center",
        }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#6B5B4F"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: INPUT_BG,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              color: TEXT,
              marginBottom: 12,
              fontSize: 16,
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6B5B4F"
            secureTextEntry
            style={{
              backgroundColor: INPUT_BG,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              color: TEXT,
              marginBottom: 20,
              fontSize: 16,
            }}
          />

          <Pressable
            onPress={mode === "login" ? signIn : signUp}
            disabled={loading}
            style={{
              backgroundColor: BTN,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: TEXT, fontWeight: "800", fontSize: 18 }}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === "login" ? "signup" : "login")}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: MUTED, fontSize: 14 }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: TEXT, fontWeight: "600" }}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Moon */}
      <PixelMoon />

      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} color={star.color} />
      ))}

      {/* Forest at bottom */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, zIndex: 1 }}>
        {trees.map((tree, i) => (
          <Tree key={i} x={tree.x} height={tree.height} shade={tree.shade} />
        ))}
      </View>

      {/* Ground */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        backgroundColor: "#152515",
        zIndex: 2,
      }} />

      {/* Content */}
      <View style={{ flex: 1, zIndex: 10 }}>
        {mode === "welcome" ? renderWelcome() : renderAuthForm()}
      </View>
    </View>
  );
}
