// components/MembersCircleModal.tsx
// "Campfire Circle" modal — shows all group members arranged around a campfire
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { PixelCharacter, DEFAULT_CHARACTER } from "./PixelCharacter";
import type { CharacterConfig } from "./PixelCharacter";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT_COLOR = "#FFF8DC";
const MUTED = "#B8A88A";

const DANCE_POSES = [
  "waving",
  "raising_roof",
  "robot",
  "dab",
  "peace",
  "hands_up",
  "victory",
  "karate",
];

interface MembersCircleModalProps {
  visible: boolean;
  onClose: () => void;
  members: Array<{
    user_id: string;
    avatar_config: CharacterConfig | null;
    username: string | null;
  }>;
}

/** Single member slot that cycles dance poses */
function DancingMember({
  member,
  index,
  x,
  y,
}: {
  member: MembersCircleModalProps["members"][number];
  index: number;
  x: number;
  y: number;
}) {
  const [pose, setPose] = useState(
    () => DANCE_POSES[Math.floor(Math.random() * DANCE_POSES.length)]
  );

  // Cycle poses
  useEffect(() => {
    const offset = Math.random() * 800; // random offset so chars aren't in sync
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setPose((prev) => {
          let next = prev;
          while (next === prev) {
            next = DANCE_POSES[Math.floor(Math.random() * DANCE_POSES.length)];
          }
          return next;
        });
      }, 1500);
      return () => clearInterval(interval);
    }, offset);
    return () => clearTimeout(timeout);
  }, []);

  // Subtle bounce
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [scale]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const config: CharacterConfig = member.avatar_config
    ? { ...member.avatar_config, pose }
    : { ...DEFAULT_CHARACTER, pose };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100)
        .springify()
        .damping(14)}
      style={{
        position: "absolute",
        left: x - 35,
        top: y - 30,
        width: 70,
        alignItems: "center",
      }}
    >
      <Animated.View style={bounceStyle}>
        <PixelCharacter config={config} size={60} />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={{
          color: TEXT_COLOR,
          fontSize: 11,
          fontFamily: "Bitova",
          textAlign: "center",
          marginTop: 2,
          maxWidth: 70,
        }}
      >
        {member.username || "???"}
      </Text>
    </Animated.View>
  );
}

/** Pixel campfire for the center */
function PixelCampfire() {
  const glow = useSharedValue(0.6);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Glow */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#FF6B0022",
          },
          glowStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#FF8C0033",
          },
          glowStyle,
        ]}
      />
      {/* Logs */}
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View
          style={{
            width: 22,
            height: 6,
            backgroundColor: "#6B3A1F",
            borderRadius: 2,
            transform: [{ rotate: "-25deg" }],
            marginRight: -4,
          }}
        />
        <View
          style={{
            width: 22,
            height: 6,
            backgroundColor: "#8B5E3C",
            borderRadius: 2,
            transform: [{ rotate: "25deg" }],
            marginLeft: -4,
          }}
        />
      </View>
      {/* Flames */}
      <View style={{ flexDirection: "row", marginBottom: -2 }}>
        <View
          style={{
            width: 6,
            height: 12,
            backgroundColor: "#FF6B35",
            borderRadius: 3,
            marginHorizontal: 1,
          }}
        />
        <View
          style={{
            width: 8,
            height: 16,
            backgroundColor: "#FFA500",
            borderRadius: 4,
            marginHorizontal: 1,
            marginTop: -4,
          }}
        />
        <View
          style={{
            width: 6,
            height: 10,
            backgroundColor: "#FFD700",
            borderRadius: 3,
            marginHorizontal: 1,
          }}
        />
      </View>
    </View>
  );
}

export function MembersCircleModal({
  visible,
  onClose,
  members,
}: MembersCircleModalProps) {
  const count = members.length;

  // Circle layout
  const circleRadius = count <= 4 ? 90 : count <= 8 ? 110 : 130;
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.42;

  // For large groups, use a ScrollView
  const needsScroll = count > 10;

  const positions = members.map((_, i) => {
    const angle = (i * (2 * Math.PI)) / count - Math.PI / 2; // start from top
    return {
      x: centerX + Math.cos(angle) * circleRadius,
      y: centerY + Math.sin(angle) * circleRadius,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.9)",
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              color: TEXT_COLOR,
              fontSize: 22,
              fontFamily: "Bitova",
            }}
          >
            Your Circle
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              padding: 8,
              backgroundColor: CARD,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: TEXT_COLOR,
                fontSize: 18,
                fontFamily: "Bitova",
              }}
            >
              X
            </Text>
          </Pressable>
        </View>

        {/* Member count */}
        <Text
          style={{
            color: MUTED,
            fontSize: 13,
            fontFamily: "Bitova",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {count} {count === 1 ? "member" : "members"}
        </Text>

        {/* Circle area */}
        {needsScroll ? (
          <ScrollView
            contentContainerStyle={{
              width: SCREEN_WIDTH,
              height: circleRadius * 2 + 200,
              position: "relative",
            }}
          >
            {/* Campfire center */}
            <View
              style={{
                position: "absolute",
                left: centerX - 20,
                top: centerY - 15,
              }}
            >
              <PixelCampfire />
            </View>
            {members.map((member, i) => (
              <DancingMember
                key={member.user_id}
                member={member}
                index={i}
                x={positions[i].x}
                y={positions[i].y - 60}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, position: "relative" }}>
            {/* Campfire center */}
            <View
              style={{
                position: "absolute",
                left: centerX - 20,
                top: centerY - 15,
              }}
            >
              <PixelCampfire />
            </View>
            {members.map((member, i) => (
              <DancingMember
                key={member.user_id}
                member={member}
                index={i}
                x={positions[i].x}
                y={positions[i].y}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}
