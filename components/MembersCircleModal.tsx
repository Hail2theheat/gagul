// components/MembersCircleModal.tsx
// "Campfire Circle" modal — shows all group members arranged around a campfire
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
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
import { CampfireColors } from "../constants/theme";
import { AnimatedLogo } from "./AnimatedLogo";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CARD = CampfireColors.CARD_SOLID;
const TEXT_COLOR = CampfireColors.TEXT_CREAM;
const MUTED = CampfireColors.MUTED;

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
    isWeeklyCrownWinner?: boolean;
    current_streak?: number;
  }>;
  streakLeaderId?: string | null;
}

/** Single member slot that cycles dance poses */
function DancingMember({
  member,
  index,
  x,
  y,
  isStreakLeader,
}: {
  member: MembersCircleModalProps["members"][number];
  index: number;
  x: number;
  y: number;
  isStreakLeader: boolean;
}) {
  const [pose, setPose] = useState(
    () => DANCE_POSES[Math.floor(Math.random() * DANCE_POSES.length)]
  );

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const offset = Math.random() * 800;
    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        setPose((prev) => {
          let next = prev;
          while (next === prev) {
            next = DANCE_POSES[Math.floor(Math.random() * DANCE_POSES.length)];
          }
          return next;
        });
      }, 1500);
    }, offset);
    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

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
      entering={FadeInDown.delay(index * 100).springify().damping(14)}
      style={{
        position: "absolute",
        left: x - 35,
        top: y - 45,
        width: 70,
        alignItems: "center",
      }}
    >
      <Animated.View style={bounceStyle}>
        <PixelCharacter
          config={config}
          size={55}
          showWeeklyCrown={!!member.isWeeklyCrownWinner}
          showTorch={isStreakLeader}
          showStreakAura={(member.current_streak || 0) >= 20}
        />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={{
          color: TEXT_COLOR,
          fontSize: 11,
          fontFamily: "Paaxel",
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

export function MembersCircleModal({
  visible,
  onClose,
  members,
  streakLeaderId,
}: MembersCircleModalProps) {
  const count = members.length;
  const circleRadius = count <= 4 ? 80 : count <= 8 ? 105 : 125;

  // Center of the screen, shifted left 10%
  const midX = SCREEN_W * 0.4;
  const midY = SCREEN_H / 2;

  const positions = members.map((_, i) => {
    const angle = (i * (2 * Math.PI)) / count - Math.PI / 2;
    return {
      x: midX + Math.cos(angle) * circleRadius,
      y: midY + Math.sin(angle) * circleRadius,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.95)" }}>

        {/* Full-screen layer: fire at exact center, characters around it */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Fire — nudged 5% right from circle center */}
          <View style={{ position: "absolute", left: midX - 25 + SCREEN_W * 0.05, top: midY - 25 }}>
            <AnimatedLogo size={50} />
          </View>

          {/* Characters in a perfect circle around the fire */}
          {members.map((member, i) => (
            <DancingMember
              key={member.user_id}
              member={member}
              index={i}
              x={positions[i].x}
              y={positions[i].y}
              isStreakLeader={member.user_id === streakLeaderId}
            />
          ))}
        </View>

        {/* Header — overlaid on top */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 12,
            zIndex: 10,
          }}
        >
          <Text style={{ color: TEXT_COLOR, fontSize: 22, fontFamily: "Paaxel" }}>
            Your Circle
          </Text>
          <Pressable
            onPress={onClose}
            style={{ padding: 8, backgroundColor: CARD, borderRadius: 8 }}
          >
            <Text style={{ color: TEXT_COLOR, fontSize: 18, fontFamily: "Paaxel" }}>
              X
            </Text>
          </Pressable>
        </View>

        {/* Member count */}
        <Text
          style={{
            color: MUTED,
            fontSize: 13,
            fontFamily: "Paaxel",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          {count} {count === 1 ? "member" : "members"}
        </Text>
      </View>
    </Modal>
  );
}
