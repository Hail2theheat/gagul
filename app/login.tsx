// app/login.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInLeft } from "react-native-reanimated";
import { supabase } from "../lib/supabase";
import { PixelCharacter, DEFAULT_CHARACTER, CharacterConfig } from "../components/PixelCharacter";
import { AnimatedLogo } from "../components/AnimatedLogo";
import { NightSky } from "../components/sky";
import { CampfireColors, Radii, Typography, Spacing } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const { BG, TEXT_CREAM: TEXT, MUTED, BTN_PRIMARY: BTN, BORDER, INPUT_BG_DARK: INPUT_BG, CARD_SOLID: CARD } = CampfireColors;

// Simple tree for login (lighter weight than DetailedPineTree)
function Tree({ x, height, shade }: { x: number; height: number; shade: number }) {
  const color = `rgba(12, ${25 + shade * 10}, ${18 + shade * 6}, 1)`;
  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.35, borderRightWidth: height * 0.35, borderBottomWidth: height * 0.3, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -6 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.45, borderRightWidth: height * 0.45, borderBottomWidth: height * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color, marginBottom: -8 }} />
      <View style={{ width: 0, height: 0, borderLeftWidth: height * 0.55, borderRightWidth: height * 0.55, borderBottomWidth: height * 0.4, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }} />
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

const CHARACTER_CONFIGS: CharacterConfig[] = [
  { skinTone: "light", hairStyle: "short", hairColor: "brown", shirtColor: "blue", shirtStyle: "tshirt", pantsColor: "black", pantsStyle: "jeans", shoeColor: "black", accessory: "none" },
  { skinTone: "brown", hairStyle: "afro", hairColor: "black", shirtColor: "red", shirtStyle: "tshirt", pantsColor: "black", pantsStyle: "jeans", shoeColor: "black", accessory: "none" },
  { skinTone: "tan", hairStyle: "long", hairColor: "blonde", shirtColor: "green", shirtStyle: "tshirt", pantsColor: "gray", pantsStyle: "jeans", shoeColor: "brown", accessory: "none" },
];

const trees = [
  { x: -20, height: 100, shade: 0 },
  { x: 15, height: 70, shade: 1 },
  { x: 50, height: 120, shade: 0 },
  { x: SCREEN_WIDTH - 90, height: 110, shade: 0 },
  { x: SCREEN_WIDTH - 50, height: 75, shade: 1 },
  { x: SCREEN_WIDTH - 10, height: 95, shade: 0 },
];

export default function LoginScreen() {
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address");
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
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xxl }}>
      <AnimatedLogo size="large" showText />

      <Text style={{ color: MUTED, fontSize: 16, marginBottom: 40, marginTop: 8, textAlign: "center" }}>
        Gather 'round the fire with friends
      </Text>

      <View style={{ height: 80, width: "100%", alignItems: "center", justifyContent: "flex-end", marginBottom: 40 }}>
        <SittingCharacter config={CHARACTER_CONFIGS[0]} position="left" />
        <SittingCharacter config={CHARACTER_CONFIGS[1]} position="right" flip />
      </View>

      <Pressable
        onPress={() => setMode("login")}
        style={{
          backgroundColor: BTN,
          borderRadius: Radii.button,
          paddingVertical: 16,
          paddingHorizontal: 48,
          width: "100%",
          maxWidth: 280,
          marginBottom: 12,
          minHeight: 44,
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign In"
      >
        <Text style={{ color: TEXT, ...Typography.button, fontSize: 18, textAlign: "center" }}>
          Sign In
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setMode("signup")}
        style={{
          backgroundColor: "transparent",
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: Radii.button,
          paddingVertical: 16,
          paddingHorizontal: 48,
          width: "100%",
          maxWidth: 280,
          minHeight: 44,
        }}
        accessibilityRole="button"
        accessibilityLabel="Create Account"
      >
        <Text style={{ color: TEXT, ...Typography.heading3, fontSize: 18, textAlign: "center" }}>
          Create Account
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderAuthForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={SlideInLeft.duration(250)} style={{ position: "absolute", top: 60, left: 24, zIndex: 10 }}>
          <Pressable
            onPress={() => setMode("welcome")}
            style={{ padding: 8, minWidth: 44, minHeight: 44 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ color: MUTED, fontSize: 16 }}>Back</Text>
          </Pressable>
        </Animated.View>

        <AnimatedLogo size={80} showText />

        <Animated.Text entering={FadeIn.delay(100).duration(250)} style={{ color: MUTED, fontSize: 16, textAlign: "center", marginBottom: 40, marginTop: 8 }}>
          {mode === "login" ? "Welcome back, friend" : "Join the circle"}
        </Animated.Text>

        <Animated.View entering={SlideInDown.springify().damping(18)} style={{
          backgroundColor: CARD,
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 20,
          padding: Spacing.xl,
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
            accessibilityLabel="Email address"
            style={{
              backgroundColor: INPUT_BG,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: Radii.md,
              padding: 14,
              color: TEXT,
              marginBottom: 12,
              ...Typography.body,
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6B5B4F"
            secureTextEntry
            accessibilityLabel="Password"
            style={{
              backgroundColor: INPUT_BG,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: Radii.md,
              padding: 14,
              color: TEXT,
              marginBottom: 20,
              ...Typography.body,
            }}
          />

          <Pressable
            onPress={mode === "login" ? signIn : signUp}
            disabled={loading}
            style={{
              backgroundColor: BTN,
              borderRadius: Radii.md,
              paddingVertical: 16,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
              minHeight: 44,
            }}
            accessibilityRole="button"
            accessibilityLabel={mode === "login" ? "Sign In" : "Create Account"}
          >
            <Text style={{ color: TEXT, ...Typography.button, fontSize: 18 }}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === "login" ? "signup" : "login")}
            style={{ marginTop: 16, alignItems: "center", minHeight: 44, justifyContent: "center" }}
            accessibilityRole="button"
            accessibilityLabel={mode === "login" ? "Switch to sign up" : "Switch to sign in"}
          >
            <Text style={{ color: MUTED, fontSize: 14 }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: TEXT, fontFamily: "Paaxel" }}>
                {mode === "login" ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Shared sky - minimal density for login */}
      <NightSky density="minimal" showMoon showShootingStars={false} showFireflies={false} showGradient={false} moonBgColor={BG} />

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
        backgroundColor: CampfireColors.GROUND_DEEP,
        zIndex: 2,
      }} />

      {/* Content */}
      <View style={{ flex: 1, zIndex: 10 }}>
        {mode === "welcome" ? renderWelcome() : renderAuthForm()}
      </View>
    </View>
  );
}
