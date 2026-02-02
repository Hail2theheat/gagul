// app/create-character.tsx
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.9)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#FF6B35";
const SELECTED = "#FF6B35";

// Pixel star
function PixelStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
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

// Pixel back arrow
function PixelArrowBack({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: 0,
        height: 0,
        borderTopWidth: size * 0.4,
        borderBottomWidth: size * 0.4,
        borderRightWidth: size * 0.5,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderRightColor: TEXT,
      }} />
      <View style={{
        position: "absolute",
        right: size * 0.1,
        width: size * 0.4,
        height: size * 0.2,
        backgroundColor: TEXT,
      }} />
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

  const stars = [
    { x: 30, y: 50, size: 2, delay: 0 },
    { x: 100, y: 80, size: 3, delay: 200 },
    { x: 180, y: 40, size: 2, delay: 400 },
    { x: 250, y: 90, size: 2, delay: 100 },
    { x: 320, y: 60, size: 3, delay: 300 },
    { x: 60, y: 120, size: 2, delay: 500 },
    { x: 140, y: 100, size: 2, delay: 150 },
    { x: 280, y: 110, size: 2, delay: 350 },
  ];

  const categories: { id: Category; label: string }[] = [
    { id: "skin", label: "Skin" },
    { id: "hair", label: "Hair" },
    { id: "shirt", label: "Shirt" },
    { id: "pants", label: "Pants" },
    { id: "shoes", label: "Shoes" },
    { id: "accessories", label: "Extras" },
    { id: "pose", label: "Pose" },
  ];

  // Load existing profile if editing
  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        if (profile.username) {
          setUsername(profile.username);
          setIsEditing(true);
        }
        if (profile.avatar_config) {
          setCharacter(profile.avatar_config as CharacterConfig);
        }
        setUserPoints(profile.total_points || 0);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const updateCharacter = (key: keyof CharacterConfig, value: string) => {
    setCharacter(prev => ({ ...prev, [key]: value }));
  };

  const isItemLocked = (item: { pointsRequired?: number; unlocked?: boolean }) => {
    if (item.unlocked) return false;
    if (item.pointsRequired && userPoints >= item.pointsRequired) return false;
    return !!item.pointsRequired;
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Username required", "Please enter a username");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert("Error", "Not logged in");
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: userData.user.id,
        username: username.trim(),
        avatar_config: character,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      if (isEditing) {
        // Go back to settings if editing
        router.back();
      } else {
        // Go to main app if new user
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isEditing) {
      router.back();
    }
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "skin":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {SKIN_TONES.map(skin => (
              <Pressable
                key={skin.id}
                onPress={() => updateCharacter("skinTone", skin.id)}
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: skin.base,
                  borderRadius: 25,
                  borderWidth: 3,
                  borderColor: character.skinTone === skin.id ? SELECTED : "transparent",
                }}
              />
            ))}
          </View>
        );

      case "hair":
        return (
          <View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {HAIR_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => !locked && updateCharacter("hairStyle", style.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: character.hairStyle === style.id ? SELECTED : CARD,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: locked ? "#444" : BORDER,
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, fontSize: 12 }}>
                      {style.name} {locked && `(${style.pointsRequired}pts)`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {HAIR_COLORS.map(color => (
                <Pressable
                  key={color.id}
                  onPress={() => updateCharacter("hairColor", color.id)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.base,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: character.hairColor === color.id ? SELECTED : "transparent",
                  }}
                />
              ))}
            </View>
          </View>
        );

      case "shirt":
        return (
          <View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {SHIRT_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => !locked && updateCharacter("shirtStyle", style.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: character.shirtStyle === style.id ? SELECTED : CARD,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: locked ? "#444" : BORDER,
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, fontSize: 12 }}>
                      {style.name} {locked && `(${style.pointsRequired}pts)`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {SHIRT_COLORS.map(color => (
                <Pressable
                  key={color.id}
                  onPress={() => updateCharacter("shirtColor", color.id)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.base,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: character.shirtColor === color.id ? SELECTED : "transparent",
                  }}
                />
              ))}
            </View>
          </View>
        );

      case "pants":
        return (
          <View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>STYLE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {PANTS_STYLES.map(style => {
                const locked = isItemLocked(style);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => !locked && updateCharacter("pantsStyle", style.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: character.pantsStyle === style.id ? SELECTED : CARD,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: locked ? "#444" : BORDER,
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, fontSize: 12 }}>
                      {style.name} {locked && `(${style.pointsRequired}pts)`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>COLOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {PANTS_COLORS.map(color => (
                <Pressable
                  key={color.id}
                  onPress={() => updateCharacter("pantsColor", color.id)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.base,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: character.pantsColor === color.id ? SELECTED : "transparent",
                  }}
                />
              ))}
            </View>
          </View>
        );

      case "shoes":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {SHOE_COLORS.map(color => (
              <Pressable
                key={color.id}
                onPress={() => updateCharacter("shoeColor", color.id)}
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: color.base,
                  borderRadius: 25,
                  borderWidth: 3,
                  borderColor: character.shoeColor === color.id ? SELECTED : "transparent",
                }}
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
                <Pressable
                  key={acc.id}
                  onPress={() => !locked && updateCharacter("accessory", acc.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: character.accessory === acc.id ? SELECTED : CARD,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: locked ? "#444" : BORDER,
                    opacity: locked ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: locked ? "#666" : TEXT, fontSize: 12 }}>
                    {acc.name} {locked && `(${acc.pointsRequired}pts)`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );

      case "pose":
        return (
          <View>
            <Text style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>
              Choose how your avatar stands
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {POSES.map(pose => {
                const locked = isItemLocked(pose);
                const isSelected = (character.pose || "idle") === pose.id;
                return (
                  <Pressable
                    key={pose.id}
                    onPress={() => !locked && updateCharacter("pose", pose.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      backgroundColor: isSelected ? SELECTED : CARD,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: locked ? "#444" : BORDER,
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: locked ? "#666" : TEXT, fontSize: 12 }}>
                      {pose.name} {locked && `(${pose.pointsRequired}pts)`}
                    </Text>
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
      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} />
      ))}

      {/* Ground */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 20, backgroundColor: "#152515" }} />

      {/* Back button (only when editing) */}
      {isEditing && (
        <Pressable
          onPress={handleBack}
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            zIndex: 100,
            flexDirection: "row",
            alignItems: "center",
            padding: 8,
          }}
        >
          <PixelArrowBack size={20} />
          <Text style={{ color: TEXT, marginLeft: 8, fontWeight: "600" }}>Back</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: isEditing ? 90 : 60, paddingBottom: 100 }}>
        <Text style={{
          color: TEXT,
          fontSize: 26,
          fontWeight: "900",
          textAlign: "center",
          marginBottom: 8,
          textShadowColor: "#FF6B35",
          textShadowRadius: 12,
        }}>
          {isEditing ? "Edit Your Character" : "Create Your Character"}
        </Text>
        <Text style={{ color: MUTED, textAlign: "center", marginBottom: 24 }}>
          {isEditing ? "Update your avatar for the campfire" : "Customize your avatar for the campfire"}
        </Text>

        {/* Points display */}
        {userPoints > 0 && (
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: CARD,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#EAB308",
            }}>
              <View style={{ width: 10, height: 10, backgroundColor: "#EAB308", borderRadius: 5, marginRight: 8 }} />
              <Text style={{ color: "#EAB308", fontWeight: "700" }}>{userPoints} points</Text>
            </View>
          </View>
        )}

        {/* Character Preview */}
        <View style={{
          alignItems: "center",
          marginBottom: 24,
          padding: 30,
          paddingHorizontal: 50,
          backgroundColor: CARD,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: BORDER,
          overflow: "visible",
        }}>
          <View style={{ overflow: "visible" }}>
            <PixelCharacter config={character} size={120} />
          </View>
        </View>

        {/* Username Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>USERNAME</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username..."
            placeholderTextColor="#6B5B4F"
            style={{
              backgroundColor: "rgba(10, 16, 32, 0.8)",
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              color: TEXT,
              fontSize: 16,
            }}
            maxLength={20}
          />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: activeCategory === cat.id ? SELECTED : CARD,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: activeCategory === cat.id ? SELECTED : BORDER,
              }}
            >
              <Text style={{ color: TEXT, fontWeight: activeCategory === cat.id ? "700" : "500" }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Content */}
        <View style={{
          backgroundColor: CARD,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 16,
          marginBottom: 24,
        }}>
          {renderCategoryContent()}
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: BTN,
            paddingVertical: 16,
            borderRadius: 14,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: TEXT, textAlign: "center", fontWeight: "800", fontSize: 18 }}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Start Your Adventure"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
