// app/create-character.tsx
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { supabase } from "../lib/supabase";
import {
  PixelCharacter,
  CharacterConfig,
  DEFAULT_CHARACTER,
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  SHIRT_COLORS,
  SHIRT_STYLES,
  PANTS_COLORS,
  PANTS_STYLES,
  SHOE_COLORS,
  ACCESSORIES,
  POSES,
} from "../components/PixelCharacter";
import { NightSky } from "../components/sky";
import { CampfireColors, Radii, Typography, Spacing, Shadows } from "../constants/theme";
import { SPRING_BOUNCY } from "../constants/animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const { BG, TEXT_CREAM: TEXT, MUTED, BTN_PRIMARY: BTN, BORDER, CARD_SOLID: CARD, INPUT_BG_DARK: INPUT_BG } = CampfireColors;
const SELECTED = BTN;

// Pixel back arrow
function PixelArrowBack({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: 0, height: 0,
        borderTopWidth: size * 0.4, borderBottomWidth: size * 0.4, borderRightWidth: size * 0.5,
        borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: TEXT,
      }} />
      <View style={{ position: "absolute", right: size * 0.1, width: size * 0.4, height: size * 0.2, backgroundColor: TEXT }} />
    </View>
  );
}

type Category = "skin" | "hair" | "shirt" | "pants" | "shoes" | "accessories" | "pose";

export default function CreateCharacterScreen() {
  const [username, setUsername] = useState("");
  const [character, setCharacter] = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const [activeCategory, setActiveCategory] = useState<Category>("skin");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  const categories: { id: Category; label: string }[] = [
    { id: "skin", label: "Skin" },
    { id: "hair", label: "Hair" },
    { id: "shirt", label: "Shirt" },
    { id: "pants", label: "Pants" },
    { id: "shoes", label: "Shoes" },
    { id: "accessories", label: "Extras" },
    { id: "pose", label: "Pose" },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        if (profile.username) { setUsername(profile.username); setIsEditing(true); }
        if (profile.avatar_config) setCharacter(profile.avatar_config as CharacterConfig);
        setUserPoints(profile.total_points || 0);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // Character preview bounce on customization change
  const previewScale = useSharedValue(1);
  const previewAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const updateCharacter = (key: keyof CharacterConfig, value: string) => {
    setCharacter(prev => ({ ...prev, [key]: value }));
    previewScale.value = withSpring(1.08, SPRING_BOUNCY);
    setTimeout(() => { previewScale.value = withSpring(1, SPRING_BOUNCY); }, 150);
  };

  const isItemLocked = (item: { pointsRequired?: number; unlocked?: boolean }) => {
    if (item.unlocked) return false;
    if (item.pointsRequired && userPoints >= item.pointsRequired) return false;
    return !!item.pointsRequired;
  };

  const handleSave = async () => {
    if (!username.trim()) { Alert.alert("Username required", "Please enter a username"); return; }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { Alert.alert("Error", "Not logged in"); return; }

      const { error } = await supabase.from("profiles").upsert({
        id: userData.user.id,
        username: username.trim(),
        avatar_config: character,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      if (isEditing) router.back();
      else router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => { if (isEditing) router.back(); };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "skin":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {SKIN_TONES.map(skin => (
              <Pressable
                key={skin.id}
                onPress={() => updateCharacter("skinTone", skin.id)}
                style={{ width: 50, height: 50, backgroundColor: skin.base, borderRadius: 25, borderWidth: 3, borderColor: character.skinTone === skin.id ? SELECTED : "transparent", minWidth: 44, minHeight: 44 }}
                accessibilityRole="button"
                accessibilityLabel={`Skin tone ${skin.id}`}
              />
            ))}
          </View>
        );

      case "hair":
        return (
          <View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {HAIR_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable key={style.id} onPress={() => !locked && updateCharacter("hairStyle", style.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: character.hairStyle === style.id ? SELECTED : CARD, borderRadius: Radii.sm, borderWidth: 1, borderColor: locked ? "#444" : BORDER, opacity: locked ? 0.5 : 1, minHeight: 44, justifyContent: "center" }}
                    accessibilityRole="button" accessibilityLabel={`Hair style ${style.name}`}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, ...Typography.caption }}>{style.name} {locked && `(${style.pointsRequired}pts)`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {HAIR_COLORS.map(color => (
                <Pressable key={color.id} onPress={() => updateCharacter("hairColor", color.id)}
                  style={{ width: 40, height: 40, backgroundColor: color.base, borderRadius: 20, borderWidth: 3, borderColor: character.hairColor === color.id ? SELECTED : "transparent", minWidth: 44, minHeight: 44 }}
                  accessibilityRole="button" accessibilityLabel={`Hair color ${color.id}`}
                />
              ))}
            </View>
          </View>
        );

      case "shirt":
        return (
          <View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {SHIRT_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable key={style.id} onPress={() => !locked && updateCharacter("shirtStyle", style.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: character.shirtStyle === style.id ? SELECTED : CARD, borderRadius: Radii.sm, borderWidth: 1, borderColor: locked ? "#444" : BORDER, opacity: locked ? 0.5 : 1, minHeight: 44, justifyContent: "center" }}
                    accessibilityRole="button" accessibilityLabel={`Shirt style ${style.name}`}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, ...Typography.caption }}>{style.name} {locked && `(${style.pointsRequired}pts)`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {SHIRT_COLORS.map(color => (
                <Pressable key={color.id} onPress={() => updateCharacter("shirtColor", color.id)}
                  style={{ width: 40, height: 40, backgroundColor: color.base, borderRadius: 20, borderWidth: 3, borderColor: character.shirtColor === color.id ? SELECTED : "transparent", minWidth: 44, minHeight: 44 }}
                  accessibilityRole="button" accessibilityLabel={`Shirt color ${color.id}`}
                />
              ))}
            </View>
          </View>
        );

      case "pants":
        return (
          <View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {PANTS_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable key={style.id} onPress={() => !locked && updateCharacter("pantsStyle", style.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: character.pantsStyle === style.id ? SELECTED : CARD, borderRadius: Radii.sm, borderWidth: 1, borderColor: locked ? "#444" : BORDER, opacity: locked ? 0.5 : 1, minHeight: 44, justifyContent: "center" }}
                    accessibilityRole="button" accessibilityLabel={`Pants style ${style.name}`}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, ...Typography.caption }}>{style.name} {locked && `(${style.pointsRequired}pts)`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {PANTS_COLORS.map(color => (
                <Pressable key={color.id} onPress={() => updateCharacter("pantsColor", color.id)}
                  style={{ width: 40, height: 40, backgroundColor: color.base, borderRadius: 20, borderWidth: 3, borderColor: character.pantsColor === color.id ? SELECTED : "transparent", minWidth: 44, minHeight: 44 }}
                  accessibilityRole="button" accessibilityLabel={`Pants color ${color.id}`}
                />
              ))}
            </View>
          </View>
        );

      case "shoes":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {SHOE_COLORS.map(color => (
              <Pressable key={color.id} onPress={() => updateCharacter("shoeColor", color.id)}
                style={{ width: 50, height: 50, backgroundColor: color.base, borderRadius: 25, borderWidth: 3, borderColor: character.shoeColor === color.id ? SELECTED : "transparent", minWidth: 44, minHeight: 44 }}
                accessibilityRole="button" accessibilityLabel={`Shoe color ${color.id}`}
              />
            ))}
          </View>
        );

      case "accessories":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ACCESSORIES.map(acc => {
              const locked = isItemLocked(acc);
              return (
                <Pressable key={acc.id} onPress={() => !locked && updateCharacter("accessory", acc.id)}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: character.accessory === acc.id ? SELECTED : CARD, borderRadius: Radii.sm, borderWidth: 1, borderColor: locked ? "#444" : BORDER, opacity: locked ? 0.5 : 1, minHeight: 44, justifyContent: "center" }}
                  accessibilityRole="button" accessibilityLabel={`Accessory ${acc.name}`}
                >
                  <Text style={{ color: locked ? "#666" : TEXT, ...Typography.caption }}>{acc.name} {locked && `(${acc.pointsRequired}pts)`}</Text>
                </Pressable>
              );
            })}
          </View>
        );

      case "pose":
        return (
          <View>
            <Text style={{ color: MUTED, ...Typography.caption, marginBottom: 12 }}>Choose how your avatar stands</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {POSES.map(pose => {
                const locked = isItemLocked(pose);
                const isSelected = (character.pose || "idle") === pose.id;
                return (
                  <Pressable key={pose.id} onPress={() => !locked && updateCharacter("pose", pose.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: isSelected ? SELECTED : CARD, borderRadius: Radii.sm, borderWidth: 1, borderColor: locked ? "#444" : BORDER, opacity: locked ? 0.5 : 1, minHeight: 44, justifyContent: "center" }}
                    accessibilityRole="button" accessibilityLabel={`Pose ${pose.name}`}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, ...Typography.caption }}>{pose.name} {locked && `(${pose.pointsRequired}pts)`}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: TEXT }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Shared sky - minimal for character creator */}
      <NightSky density="minimal" showMoon={false} showShootingStars={false} showFireflies={false} showGradient={false} />

      {/* Ground */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 20, backgroundColor: CampfireColors.GROUND_DEEP }} />

      {/* Back button (only when editing) */}
      {isEditing && (
        <Pressable
          onPress={handleBack}
          style={{ position: "absolute", top: 50, left: 20, zIndex: 100, flexDirection: "row", alignItems: "center", padding: 8, minWidth: 44, minHeight: 44 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <PixelArrowBack size={20} />
          <Text style={{ color: TEXT, marginLeft: 8, fontFamily: "Nunito_600SemiBold" }}>Back</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingTop: isEditing ? 90 : 60, paddingBottom: 100 }}>
        <Animated.Text entering={FadeIn.duration(300)} style={{
          color: TEXT,
          ...Typography.heading1,
          fontSize: 26,
          textAlign: "center",
          marginBottom: Spacing.sm,
          ...Shadows.fireGlow,
        }}>
          {isEditing ? "Edit Your Character" : "Create Your Character"}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(100).duration(300)} style={{ color: MUTED, textAlign: "center", marginBottom: Spacing.xxl }}>
          {isEditing ? "Update your avatar for the campfire" : "Customize your avatar for the campfire"}
        </Animated.Text>

        {userPoints > 0 && (
          <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: CARD, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
              borderRadius: Radii.pill, borderWidth: 1, borderColor: CampfireColors.WARNING,
            }}>
              <View style={{ width: 10, height: 10, backgroundColor: CampfireColors.WARNING, borderRadius: 5, marginRight: 8 }} />
              <Text style={{ color: CampfireColors.WARNING, ...Typography.heading3 }}>{userPoints} points</Text>
            </View>
          </View>
        )}

        {/* Character Preview */}
        <Animated.View entering={FadeInDown.duration(400).springify().damping(18)} style={{
          alignItems: "center", marginBottom: Spacing.xxl,
          padding: 30, paddingHorizontal: 50,
          backgroundColor: CARD, borderRadius: Radii.lg, borderWidth: 1, borderColor: BORDER,
          overflow: "visible",
        }}>
          <Animated.View style={[{ overflow: "visible" }, previewAnimStyle]}>
            <PixelCharacter config={character} size={120} />
          </Animated.View>
        </Animated.View>

        {/* Username Input */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{ color: MUTED, ...Typography.caption, marginBottom: Spacing.sm }}>USERNAME</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username..."
            placeholderTextColor="#6B5B4F"
            accessibilityLabel="Username"
            style={{
              backgroundColor: INPUT_BG, borderColor: BORDER, borderWidth: 1, borderRadius: Radii.md,
              padding: 14, color: TEXT, ...Typography.body,
            }}
            maxLength={20}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }} contentContainerStyle={{ gap: 8 }}>
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={{
                paddingHorizontal: Spacing.lg, paddingVertical: 10,
                backgroundColor: activeCategory === cat.id ? SELECTED : CARD,
                borderRadius: 10, borderWidth: 1,
                borderColor: activeCategory === cat.id ? SELECTED : BORDER,
                minHeight: 44, justifyContent: "center",
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeCategory === cat.id }}
              accessibilityLabel={cat.label}
            >
              <Text style={{ color: TEXT, fontWeight: activeCategory === cat.id ? "700" : "500" }}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Content */}
        <View style={{
          backgroundColor: CARD, borderRadius: Radii.lg, borderWidth: 1, borderColor: BORDER,
          padding: Spacing.lg, marginBottom: Spacing.xxl,
        }}>
          <Animated.View key={activeCategory} entering={FadeInRight.duration(250)} exiting={FadeOut.duration(150)}>
            {renderCategoryContent()}
          </Animated.View>
        </View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: BTN, paddingVertical: 16, borderRadius: Radii.button,
              opacity: saving ? 0.6 : 1, minHeight: 44,
            }}
            accessibilityRole="button"
            accessibilityLabel={saving ? "Saving..." : isEditing ? "Save Changes" : "Start Your Adventure"}
          >
            <Text style={{ color: TEXT, textAlign: "center", ...Typography.button, fontSize: 18 }}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Start Your Adventure"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
