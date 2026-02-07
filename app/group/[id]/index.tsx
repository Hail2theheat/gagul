// app/group/[id]/index.tsx
import { useGlobalSearchParams, router } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Alert, ScrollView, Text, View, Pressable, RefreshControl, Animated, Dimensions, Easing, Modal, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

import { supabase } from "../../../lib/supabase";
import { PromptCard } from "../../../components/prompts";
import { QuiplashCard } from "../../../components/prompts/QuiplashCard";
import { QuiplashVotingCard } from "../../../components/prompts/QuiplashVotingCard";
import { TelephoneCard } from "../../../components/prompts/TelephoneCard";
import { getMyQuiplash, getQuiplashMatchups, QuiplashAssignment, QuiplashMatchup } from "../../../lib/services/quiplashService";
import { getMyTelephone, TelephoneAssignment } from "../../../lib/services/telephoneService";
import { PixelCharacter, CharacterConfig, DEFAULT_CHARACTER } from "../../../components/PixelCharacter";
import { DetailedCampfire, DetailedPineTree, DetailedGrass } from "../../../components/PixelArt";
import { WeatherBackground } from "../../../components/WeatherBackground";
import type { GroupStatus, GroupPrompt } from "../../../lib/types/prompts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BG = "#0B1026";
const CARD = "rgba(20, 30, 50, 0.85)";
const BORDER = "#2a3f5f";
const TEXT = "#FFF8DC";
const MUTED = "#B8A88A";
const BTN = "#1E4ED8";
const BTN_ORANGE = "#FF6B35";
const DANGER = "#EF4444";

// Soft glowing text component
function FireText({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ position: "relative" }, style]}>
      {/* Soft outer glow */}
      <Text style={{
        color: "transparent",
        fontSize: 28,
        fontWeight: "900",
        textShadowColor: "#F59E0B",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        position: "absolute",
      }}>
        {children}
      </Text>
      {/* Inner glow */}
      <Text style={{
        color: "transparent",
        fontSize: 28,
        fontWeight: "900",
        textShadowColor: "#FCD34D",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        position: "absolute",
      }}>
        {children}
      </Text>
      {/* Main text - soft yellow */}
      <Text style={{
        color: "#FEF3C7",
        fontSize: 28,
        fontWeight: "900",
      }}>
        {children}
      </Text>
    </View>
  );
}

// Pixel back arrow icon
function PixelBackIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.5, height: size * 0.12, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "-45deg" }, { translateY: -size * 0.15 }] }} />
      <View style={{ width: size * 0.5, height: size * 0.12, backgroundColor: TEXT, position: "absolute", transform: [{ rotate: "45deg" }, { translateY: size * 0.15 }] }} />
      <View style={{ width: size * 0.6, height: size * 0.12, backgroundColor: TEXT, position: "absolute", left: size * 0.1 }} />
    </View>
  );
}

// Pixel gear icon for settings - 8 tooth metallic gear
function PixelGearIcon({ size = 24 }: { size?: number }) {
  const s = size / 24; // Scale factor
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Gear teeth - 8 directions */}
      {/* Top */}
      <View style={{ position: "absolute", top: 0, width: 6*s, height: 6*s, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", top: 0, width: 6*s, height: 3*s, backgroundColor: "#9CA3AF" }} />
      <View style={{ position: "absolute", top: 0, left: 9*s, width: 1*s, height: 2*s, backgroundColor: "#1F2937" }} />
      {/* Bottom */}
      <View style={{ position: "absolute", bottom: 0, width: 6*s, height: 6*s, backgroundColor: "#4B5563" }} />
      <View style={{ position: "absolute", bottom: 1*s, width: 6*s, height: 2*s, backgroundColor: "#6B7280" }} />
      {/* Left */}
      <View style={{ position: "absolute", left: 0, width: 6*s, height: 6*s, backgroundColor: "#6B7280" }} />
      <View style={{ position: "absolute", left: 0, width: 3*s, height: 6*s, backgroundColor: "#9CA3AF" }} />
      {/* Right */}
      <View style={{ position: "absolute", right: 0, width: 6*s, height: 6*s, backgroundColor: "#4B5563" }} />
      <View style={{ position: "absolute", right: 0, width: 2*s, height: 6*s, backgroundColor: "#374151" }} />
      {/* Diagonal teeth */}
      <View style={{ position: "absolute", top: 2*s, left: 2*s, width: 5*s, height: 5*s, backgroundColor: "#6B7280", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", top: 2*s, right: 2*s, width: 5*s, height: 5*s, backgroundColor: "#4B5563", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", bottom: 2*s, left: 2*s, width: 5*s, height: 5*s, backgroundColor: "#6B7280", transform: [{ rotate: "45deg" }] }} />
      <View style={{ position: "absolute", bottom: 2*s, right: 2*s, width: 5*s, height: 5*s, backgroundColor: "#374151", transform: [{ rotate: "45deg" }] }} />
      {/* Center body */}
      <View style={{ width: 14*s, height: 14*s, borderRadius: 7*s, backgroundColor: "#6B7280", position: "absolute" }} />
      <View style={{ width: 12*s, height: 12*s, borderRadius: 6*s, backgroundColor: "#9CA3AF", position: "absolute", top: 5*s }} />
      <View style={{ width: 14*s, height: 7*s, borderRadius: 7*s, backgroundColor: "#9CA3AF", position: "absolute", top: 5*s }} />
      {/* Inner ring */}
      <View style={{ width: 10*s, height: 10*s, borderRadius: 5*s, backgroundColor: "#4B5563", position: "absolute" }} />
      <View style={{ width: 8*s, height: 8*s, borderRadius: 4*s, backgroundColor: "#6B7280", position: "absolute" }} />
      {/* Center hole */}
      <View style={{ width: 5*s, height: 5*s, borderRadius: 2.5*s, backgroundColor: "#1F2937", position: "absolute" }} />
      {/* Black outline effect */}
      <View style={{ width: size, height: size, borderRadius: 2*s, borderWidth: 1, borderColor: "#1F2937", position: "absolute", opacity: 0.3 }} />
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

// Pixel person icon
function PixelPersonIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: TEXT, borderRadius: size * 0.175 }} />
      <View style={{ width: size * 0.6, height: size * 0.35, backgroundColor: TEXT, borderTopLeftRadius: size * 0.15, borderTopRightRadius: size * 0.15, marginTop: size * 0.05 }} />
    </View>
  );
}

// Pixel calendar icon
function PixelCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size * 0.8, backgroundColor: TEXT, borderRadius: size * 0.1, position: "absolute", bottom: 0 }}>
        <View style={{ position: "absolute", top: size * 0.15, left: size * 0.15, right: size * 0.15, height: size * 0.1, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.35, left: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.35, right: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
        <View style={{ position: "absolute", top: size * 0.55, left: size * 0.15, width: size * 0.2, height: size * 0.15, backgroundColor: BG }} />
      </View>
      <View style={{ position: "absolute", top: 0, left: size * 0.2, width: size * 0.12, height: size * 0.25, backgroundColor: TEXT }} />
      <View style={{ position: "absolute", top: 0, right: size * 0.2, width: size * 0.12, height: size * 0.25, backgroundColor: TEXT }} />
    </View>
  );
}

// Pixel door/leave icon
function PixelDoorIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.6, height: size * 0.85, backgroundColor: "#78350F", borderRadius: size * 0.05 }}>
        <View style={{ position: "absolute", right: size * 0.1, top: size * 0.35, width: size * 0.1, height: size * 0.1, backgroundColor: "#EAB308", borderRadius: size * 0.05 }} />
      </View>
      <View style={{ position: "absolute", right: 0, top: size * 0.3, width: size * 0.3, height: size * 0.1, backgroundColor: DANGER }} />
      <View style={{ position: "absolute", right: 0, width: 0, height: 0, borderTopWidth: size * 0.15, borderBottomWidth: size * 0.15, borderLeftWidth: size * 0.15, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: DANGER, top: size * 0.2 }} />
    </View>
  );
}

// Marshmallow stick component
function MarshmallowStick({ size = 50 }: { size?: number }) {
  const scale = size / 50;
  return (
    <View style={{ position: "absolute", right: -20 * scale, top: 15 * scale }}>
      {/* Stick */}
      <View style={{
        width: 3 * scale,
        height: 35 * scale,
        backgroundColor: "#8B4513",
        borderRadius: 1.5 * scale,
        transform: [{ rotate: "45deg" }],
      }} />
      {/* Marshmallow */}
      <View style={{
        position: "absolute",
        top: -8 * scale,
        right: -12 * scale,
        width: 14 * scale,
        height: 12 * scale,
        backgroundColor: "#FFF8DC",
        borderRadius: 6 * scale,
        borderWidth: 1,
        borderColor: "#DEB887",
      }}>
        {/* Toasted spots */}
        <View style={{ position: "absolute", top: 3 * scale, left: 2 * scale, width: 4 * scale, height: 3 * scale, backgroundColor: "#D2691E", borderRadius: 2 * scale, opacity: 0.7 }} />
        <View style={{ position: "absolute", bottom: 2 * scale, right: 3 * scale, width: 3 * scale, height: 2 * scale, backgroundColor: "#CD853F", borderRadius: 1 * scale, opacity: 0.5 }} />
      </View>
    </View>
  );
}

// Silly action types
type SillyAction = 'none' | 'flip' | 'doubleFlip' | 'cartwheel' | 'walkWall' | 'hangCeiling' | 'headstand';

// Walking character component with occasional silly behavior
function WalkingCharacter({ config, onPositionChange }: { config: CharacterConfig; onPositionChange?: (x: number, facingRight: boolean) => void }) {
  const walkAnim = useRef(new Animated.Value(20)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const verticalAnim = useRef(new Animated.Value(0)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current; // For jumping over logs
  const scaleYAnim = useRef(new Animated.Value(1)).current;

  const [facingRight, setFacingRight] = useState(true);
  const [sillyAction, setSillyAction] = useState<SillyAction>('none');
  const [showMarshmallow, setShowMarshmallow] = useState(true);
  const directionRef = useRef(true);
  const isSillyRef = useRef(false);
  const currentXRef = useRef(20);

  // Track if avatar is on a log and adjust height accordingly
  const lastOnLogRef = useRef(false);
  const targetHeightRef = useRef(0);

  const checkForLogs = useCallback((currentX: number, direction: boolean) => {
    if (isSillyRef.current) return;

    const logs = logPositionsRef.current;
    const charWidth = 25; // Center point of character
    const logWidth = 22;
    const logHeight = 11;

    // Check if avatar is standing on any log
    let onLog = false;
    for (const logX of logs) {
      // Character center is at currentX + charWidth
      const charCenter = currentX + charWidth;
      // Check if character center is over the log
      if (charCenter >= logX && charCenter <= logX + logWidth) {
        onLog = true;
        break;
      }
    }

    // Smoothly transition height based on whether on log or ground
    const targetHeight = onLog ? -logHeight : 0;

    if (targetHeight !== targetHeightRef.current) {
      targetHeightRef.current = targetHeight;

      // Animate to new height
      Animated.timing(jumpAnim, {
        toValue: targetHeight,
        duration: 100, // Quick but smooth transition
        easing: onLog ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // Broadcast position periodically
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    // Track position for log detection and broadcasting
    const listenerId = walkAnim.addListener(({ value }) => {
      currentXRef.current = value;
      checkForLogs(value, directionRef.current);

      // Broadcast position every 500ms to avoid spam
      const now = Date.now();
      if (onPositionChange && now - lastBroadcastRef.current > 500) {
        lastBroadcastRef.current = now;
        onPositionChange(value, directionRef.current);
      }
    });

    // Walk animation - move back and forth
    const walkRight = () => {
      if (isSillyRef.current) return; // Don't walk during silly action
      directionRef.current = true;
      setFacingRight(true);
      Animated.timing(walkAnim, {
        toValue: SCREEN_WIDTH - 70,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        if (!isSillyRef.current) setTimeout(walkLeft, 800);
      });
    };

    const walkLeft = () => {
      if (isSillyRef.current) return;
      directionRef.current = false;
      setFacingRight(false);
      Animated.timing(walkAnim, {
        toValue: 20,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        if (!isSillyRef.current) setTimeout(walkRight, 800);
      });
    };

    // Bounce animation
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -2, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    bounceLoop.start();

    // Silly action trigger - random interval between 12-25 seconds
    const triggerSillyAction = () => {
      const actions: SillyAction[] = ['flip', 'doubleFlip', 'cartwheel', 'walkWall', 'hangCeiling', 'headstand'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      isSillyRef.current = true;
      walkAnim.stopAnimation();
      setSillyAction(randomAction);

      // Perform the silly action animation
      switch (randomAction) {
        case 'flip':
          Animated.sequence([
            Animated.timing(verticalAnim, { toValue: -80, duration: 400, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 360, duration: 600, useNativeDriver: true }),
            Animated.timing(verticalAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;

        case 'doubleFlip':
          Animated.sequence([
            Animated.timing(verticalAnim, { toValue: -120, duration: 500, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 720, duration: 1000, useNativeDriver: true }),
            Animated.timing(verticalAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;

        case 'cartwheel':
          Animated.parallel([
            Animated.timing(rotateAnim, { toValue: 360, duration: 800, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(walkAnim, { toValue: walkAnim._value + 100, duration: 800, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(verticalAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
              Animated.timing(verticalAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
              Animated.timing(verticalAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
              Animated.timing(verticalAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;

        case 'walkWall':
          Animated.sequence([
            // Walk to edge
            Animated.timing(walkAnim, { toValue: SCREEN_WIDTH - 50, duration: 500, useNativeDriver: true }),
            // Rotate and climb
            Animated.parallel([
              Animated.timing(rotateAnim, { toValue: -90, duration: 300, useNativeDriver: true }),
              Animated.timing(verticalAnim, { toValue: -150, duration: 2000, useNativeDriver: true }),
            ]),
            // Pause at top
            Animated.delay(500),
            // Come back down
            Animated.parallel([
              Animated.timing(verticalAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;

        case 'hangCeiling':
          Animated.sequence([
            // Jump up
            Animated.timing(verticalAnim, { toValue: -250, duration: 600, useNativeDriver: true }),
            // Flip upside down
            Animated.timing(rotateAnim, { toValue: 180, duration: 300, useNativeDriver: true }),
            // Hang there
            Animated.delay(2000),
            // Drop and flip back
            Animated.parallel([
              Animated.timing(verticalAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 360, duration: 500, useNativeDriver: true }),
            ]),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;

        case 'headstand':
          Animated.sequence([
            // Flip upside down in place
            Animated.timing(rotateAnim, { toValue: 180, duration: 400, useNativeDriver: true }),
            // Little bounce while upside down
            Animated.loop(
              Animated.sequence([
                Animated.timing(verticalAnim, { toValue: 5, duration: 200, useNativeDriver: true }),
                Animated.timing(verticalAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
              ]),
              { iterations: 5 }
            ),
            // Flip back
            Animated.timing(rotateAnim, { toValue: 360, duration: 400, useNativeDriver: true }),
          ]).start(() => endSillyAction(walkRight, walkLeft));
          break;
      }
    };

    const endSillyAction = (walkRight: () => void, walkLeft: () => void) => {
      rotateAnim.setValue(0);
      verticalAnim.setValue(0);
      setSillyAction('none');
      isSillyRef.current = false;
      // Resume walking
      setTimeout(() => {
        if (directionRef.current) walkRight();
        else walkLeft();
      }, 500);
    };

    // Start walking
    walkRight();

    // Schedule silly actions
    const scheduleSilly = () => {
      const delay = 12000 + Math.random() * 13000; // 12-25 seconds
      return setTimeout(() => {
        if (!isSillyRef.current) triggerSillyAction();
        sillyTimer = scheduleSilly();
      }, delay);
    };
    let sillyTimer = scheduleSilly();

    return () => {
      walkAnim.stopAnimation();
      walkAnim.removeListener(listenerId);
      bounceAnim.stopAnimation();
      rotateAnim.stopAnimation();
      verticalAnim.stopAnimation();
      jumpAnim.stopAnimation();
      clearTimeout(sillyTimer);
    };
  }, [checkForLogs]);

  // Calculate rotation in degrees for transform
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360, 720],
    outputRange: ['0deg', '360deg', '720deg'],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 35,
        left: 0,
        transform: [
          { translateX: walkAnim },
          { translateY: Animated.add(Animated.add(bounceAnim, verticalAnim), jumpAnim) },
          { rotate: rotateInterpolate },
          { scaleX: facingRight ? 1 : -1 },
        ],
        zIndex: 100,
        overflow: "visible",
      }}
    >
      <PixelCharacter config={config} size={50} />
      {/* Only show marshmallow on Sunday */}
      {showMarshmallow && getSundayState() !== 'not-sunday' && <MarshmallowStick size={50} />}
    </Animated.View>
  );
}

// Store log positions globally so walking character can access them
const logPositionsRef = { current: [] as number[] };

// Type for presence state
interface UserPresence {
  userId: string;
  avatarConfig: CharacterConfig;
  x: number;
  facingRight: boolean;
}

// Other user's walking character (follows their broadcasted position with bounce)
function OtherUserCharacter({ presence }: { presence: UserPresence }) {
  const positionAnim = useRef(new Animated.Value(presence.x)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [facingRight, setFacingRight] = useState(presence.facingRight);

  // Bounce animation - continuous like the main character
  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -2,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bounceLoop.start();

    return () => bounceLoop.stop();
  }, []);

  useEffect(() => {
    // Animate to new position when it changes
    setFacingRight(presence.facingRight);
    Animated.timing(positionAnim, {
      toValue: presence.x,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [presence.x, presence.facingRight]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 35,
        left: 0,
        transform: [
          { translateX: positionAnim },
          { translateY: bounceAnim },
          { scaleX: facingRight ? 1 : -1 },
        ],
        zIndex: 99,
        opacity: 0.9,
      }}
    >
      <PixelCharacter config={presence.avatarConfig} size={50} />
    </Animated.View>
  );
}

// Falling log with physics animation
function FallingLog({ finalX, delay, finalRotation, onLanded }: { finalX: number; delay: number; finalRotation: number; onLanded?: (x: number) => void }) {
  const fallAnim = useRef(new Animated.Value(-100)).current; // Start above screen
  const rotateAnim = useRef(new Animated.Value(Math.random() * 360)).current; // Random starting rotation
  const startX = useRef(Math.random() * SCREEN_WIDTH).current; // Random starting X
  const horizontalAnim = useRef(new Animated.Value(startX)).current;

  // Ground level - top of grass (grass is 30px tall, so bottom: 30 is grass top)
  // Log height is 11, so we position the log so its bottom touches the grass
  const groundLevel = SCREEN_HEIGHT - 30 - 11;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fall down with slight curve toward final position
      Animated.parallel([
        // Vertical fall with bounce
        Animated.sequence([
          // Initial fall - hit the ground
          Animated.timing(fallAnim, {
            toValue: groundLevel,
            duration: 600 + Math.random() * 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // First bounce up
          Animated.timing(fallAnim, {
            toValue: groundLevel - 30 - Math.random() * 20,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Fall back down
          Animated.timing(fallAnim, {
            toValue: groundLevel,
            duration: 120,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Small second bounce
          Animated.timing(fallAnim, {
            toValue: groundLevel - 10 - Math.random() * 8,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Settle on ground
          Animated.timing(fallAnim, {
            toValue: groundLevel,
            duration: 60,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Horizontal drift to final position
        Animated.timing(horizontalAnim, {
          toValue: finalX,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Tumble rotation during fall, settle at final angle
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: finalRotation + (Math.random() > 0.5 ? 720 : -720), // Tumble
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Slight rotation adjustment on bounce
          Animated.timing(rotateAnim, {
            toValue: finalRotation,
            duration: 300,
            easing: Easing.out(Easing.elastic(1)),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Notify that log has landed
        if (onLanded) onLanded(finalX);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-720, 0, 720],
    outputRange: ['-720deg', '0deg', '720deg'],
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: 22,
      height: 11,
      backgroundColor: '#5D3A1A',
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#3D2510',
      zIndex: 90,
      transform: [
        { translateX: horizontalAnim },
        { translateY: fallAnim },
        { rotate: rotateInterpolate },
      ],
    }}>
      {/* Wood grain */}
      <View style={{ position: 'absolute', top: 2, left: 3, width: 5, height: 3, backgroundColor: '#4A2E15', borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 5, left: 11, width: 4, height: 2, backgroundColor: '#4A2E15', borderRadius: 1 }} />
    </Animated.View>
  );
}

// Logs that rain down and settle at bottom
function StreakLogs({ streak }: { streak: number }) {
  const [key, setKey] = useState(0); // Key to force re-render for new random animation
  const [logPositions, setLogPositions] = useState<number[]>([]);

  useEffect(() => {
    // Generate new random positions each time component mounts
    setKey(prev => prev + 1);
    logPositionsRef.current = [];
  }, []);

  // Update global ref when log positions change
  useEffect(() => {
    logPositionsRef.current = logPositions;
  }, [logPositions]);

  const handleLogLanded = useCallback((x: number) => {
    setLogPositions(prev => [...prev, x].sort((a, b) => a - b));
  }, []);

  if (streak === 0) return null;

  const logCount = streak;
  const logWidth = 22;
  const logSpacing = 8;
  const totalWidth = logCount * logWidth + (logCount - 1) * logSpacing;
  const startX = (SCREEN_WIDTH - totalWidth) / 2;

  const logs = [];
  for (let i = 0; i < logCount; i++) {
    // Random final position with some variance
    const baseX = startX + i * (logWidth + logSpacing);
    const finalX = baseX + (Math.random() - 0.5) * 15; // Slight random offset
    const delay = i * 120 + Math.random() * 100; // Staggered with randomness
    const finalRotation = (Math.random() - 0.5) * 30; // Random tilt -15 to +15 degrees

    logs.push(
      <FallingLog
        key={`${key}-${i}`}
        finalX={finalX}
        delay={delay}
        finalRotation={finalRotation}
        onLanded={handleLogLanded}
      />
    );
  }

  return <>{logs}</>;
}

// Fire badge with number inside the flame
function FireStreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <View style={{
      marginLeft: 10,
      width: 28,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Fire shape - outer glow */}
      <View style={{
        position: 'absolute',
        width: 26,
        height: 30,
        backgroundColor: 'rgba(255, 100, 50, 0.3)',
        borderRadius: 13,
        transform: [{ scaleY: 1.2 }],
      }} />

      {/* Main flame body */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        width: 22,
        height: 26,
        backgroundColor: '#FF6B35',
        borderTopLeftRadius: 11,
        borderTopRightRadius: 11,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }} />

      {/* Flame tip (top) */}
      <View style={{
        position: 'absolute',
        top: 0,
        width: 12,
        height: 14,
        backgroundColor: '#FF4500',
        borderRadius: 6,
        transform: [{ scaleY: 1.3 }],
      }} />

      {/* Inner flame (yellow/orange) */}
      <View style={{
        position: 'absolute',
        bottom: 2,
        width: 14,
        height: 16,
        backgroundColor: '#FFD93D',
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
      }} />

      {/* Inner flame tip */}
      <View style={{
        position: 'absolute',
        top: 6,
        width: 8,
        height: 10,
        backgroundColor: '#FFF3B0',
        borderRadius: 4,
        transform: [{ scaleY: 1.2 }],
      }} />

      {/* Number - centered in flame */}
      <Text style={{
        position: 'absolute',
        color: '#7C2D12',
        fontWeight: '900',
        fontSize: streak >= 100 ? 10 : streak >= 10 ? 12 : 14,
        textAlign: 'center',
        top: 10,
        textShadowColor: 'rgba(255, 200, 100, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
      }}>
        {streak}
      </Text>
    </View>
  );
}

// Wrapper that loads user profile and shows walking character
function UserWalkingCharacter({ onPositionChange }: { onPositionChange?: (x: number, facingRight: boolean) => void }) {
  const [avatarConfig, setAvatarConfig] = useState<CharacterConfig | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_config")
        .eq("id", userData.user.id)
        .single();

      if (profile?.avatar_config) {
        setAvatarConfig(profile.avatar_config as CharacterConfig);
      } else {
        setAvatarConfig(DEFAULT_CHARACTER);
      }
    };

    loadProfile();
  }, []);

  if (!avatarConfig) return null;

  return <WalkingCharacter config={avatarConfig} onPositionChange={onPositionChange} />;
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
        borderColor: BORDER,
        borderWidth: isSolid ? 0 : 1,
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

// Sunday state types
type SundayState = 'not-sunday' | 'pre-fireside' | 'during-fireside' | 'post-fireside';

// Get Sunday state based on current time (Fireside only on Sundays 9PM-3AM EST)
function getSundayState(): SundayState {
  const now = new Date();

  // Get EST time
  const estOffset = -5 * 60;
  const localOffset = now.getTimezoneOffset();
  const estTime = new Date(now.getTime() + (localOffset + estOffset) * 60 * 1000);

  const day = estTime.getDay(); // 0 = Sunday, 1 = Monday
  const hour = estTime.getHours();

  // Sunday before 9 PM EST: pre-fireside
  if (day === 0 && hour < 21) return 'pre-fireside';

  // Sunday 9 PM onwards OR Monday before 3 AM: during-fireside
  if (day === 0 && hour >= 21) return 'during-fireside';
  if (day === 1 && hour < 3) return 'during-fireside';

  // Monday 3 AM to end of day: post-fireside
  if (day === 1 && hour >= 3) return 'post-fireside';

  return 'not-sunday';
}

// Check if fireside should be visible (Sunday 9 PM EST to Monday 3 AM EST)
function isFiresideTime(): boolean {
  return getSundayState() === 'during-fireside';
}

// Get fireside time in user's local timezone
function getFiresideLocalTime(): string {
  // Fireside is 9 PM EST - convert to local time
  const now = new Date();
  const estOffset = -5 * 60; // EST is UTC-5 in minutes

  // Create a date for 9 PM EST today (or next Sunday)
  const estNine = new Date();
  estNine.setUTCHours(21 + 5, 0, 0, 0); // 9 PM EST = 2 AM UTC next day, but we want same day

  // Format in user's local time
  return estNine.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Floating ember particle for fireside button
function FiresideEmber({ delay, index }: { delay: number; index: number }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const side = index % 3 === 0 ? -1 : index % 3 === 1 ? 1 : 0;
  const startX = side * (20 + Math.random() * 30);

  useEffect(() => {
    const animate = () => {
      floatAnim.setValue(0);
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 2000 + Math.random() * 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => animate());
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 6 + Math.random() * 4,
        height: 6 + Math.random() * 4,
        borderRadius: 5,
        backgroundColor: floatAnim.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: ['#FFD93D', '#FF6B35', '#FF4500', '#FF4500'],
        }) as any,
        bottom: 60,
        left: '50%',
        marginLeft: startX,
        opacity: floatAnim.interpolate({
          inputRange: [0, 0.2, 0.7, 1],
          outputRange: [0, 1, 0.6, 0],
        }),
        transform: [
          { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120 - Math.random() * 60] }) },
          { translateX: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, side * (15 + Math.random() * 20)] }) },
          { scale: floatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 0.3] }) },
        ],
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }}
    />
  );
}

// Big exciting fireside button with embers
function BigFiresideButton({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const emberDelays = [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300];

  return (
    <Pressable onPress={onPress} style={{ marginTop: 16 }}>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
          borderRadius: 24,
          overflow: 'visible',
        }}
      >
        {/* Outer glow */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            right: -20,
            bottom: -20,
            borderRadius: 44,
            backgroundColor: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 107, 53, 0.1)', 'rgba(255, 107, 53, 0.25)'],
            }) as any,
          }}
        />

        {/* Embers */}
        {emberDelays.map((delay, i) => (
          <FiresideEmber key={i} delay={delay} index={i} />
        ))}

        {/* Main button */}
        <View
          style={{
            backgroundColor: '#1a1a2e',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#FF6B35',
            padding: 24,
            alignItems: 'center',
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          }}
        >
          {/* Big campfire */}
          <DetailedCampfire size={100} showSmoke={false} />

          <Text
            style={{
              color: '#FFD93D',
              fontWeight: '900',
              fontSize: 24,
              marginTop: 16,
              textShadowColor: '#FF6B35',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 15,
              letterSpacing: 1,
            }}
          >
            WEEKLY FIRESIDE
          </Text>

          <Text
            style={{
              color: '#FFF8DC',
              fontSize: 16,
              marginTop: 8,
              opacity: 0.9,
            }}
          >
            Gather 'round the fire
          </Text>

          {/* Animated bottom glow bar */}
          <Animated.View
            style={{
              marginTop: 16,
              height: 4,
              width: '80%',
              borderRadius: 2,
              backgroundColor: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#FF4500', '#FFD93D'],
              }) as any,
              shadowColor: '#FF6B35',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function GroupScreen() {
  const params = useGlobalSearchParams();
  const raw = (params as any)?.id ?? (params as any)?.Id;
  const groupId = typeof raw === "string" ? raw : undefined;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<GroupStatus | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupCode, setGroupCode] = useState<string | null>(null);
  const [groupCreatedAt, setGroupCreatedAt] = useState<string | null>(null);
  const [groupStreak, setGroupStreak] = useState<number>(0);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [myAvatar, setMyAvatar] = useState<CharacterConfig | null>(null);
  const [allMembers, setAllMembers] = useState<Array<{ user_id: string; avatar_config: CharacterConfig | null }>>([]);
  const [quiplashAssignment, setQuiplashAssignment] = useState<QuiplashAssignment | null>(null);
  const [pendingQuiplashVotes, setPendingQuiplashVotes] = useState<QuiplashMatchup[]>([]);
  const [telephoneAssignment, setTelephoneAssignment] = useState<TelephoneAssignment | null>(null);
  const [showFireside, setShowFireside] = useState(isFiresideTime());
  const [sundayState, setSundayState] = useState<SundayState>(getSundayState());

  // Presence state - other users on this screen
  const [otherUsers, setOtherUsers] = useState<UserPresence[]>([]);
  const channelRef = useRef<any>(null);
  const myPositionRef = useRef({ x: 20, facingRight: true });

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const active = status?.active_prompt_instance ?? null;
  const hasResponded = status?.has_responded ?? false;
  const hasRated = status?.has_rated ?? false;
  const userRating = status?.user_rating ?? null;

  // Check if active prompt is quiplash (we handle those separately)
  const isQuiplashPrompt = active?.prompts?.type === 'quiplash';

  // Check fireside time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setShowFireside(isFiresideTime());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Set up presence channel for real-time user visibility
  useEffect(() => {
    if (!groupId) return;

    let currentUserId: string | null = null;

    const setupPresence = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      currentUserId = userData.user.id;

      // Create presence channel for this group
      const channel = supabase.channel(`group-presence-${groupId}`, {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: UserPresence[] = [];

          Object.entries(state).forEach(([presenceKey, presences]) => {
            // Skip own presence
            if (presenceKey !== currentUserId && presences.length > 0) {
              const p = presences[0] as any;
              users.push({
                userId: presenceKey,
                avatarConfig: p.avatarConfig || DEFAULT_CHARACTER,
                x: p.x ?? 20,
                facingRight: p.facingRight ?? true,
              });
            }
          });

          setOtherUsers(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[Presence] User joined:', key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('[Presence] User left:', key);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track own presence immediately with default or loaded avatar
            const avatarToUse = myAvatar || DEFAULT_CHARACTER;
            await channel.track({
              avatarConfig: avatarToUse,
              x: myPositionRef.current.x,
              facingRight: myPositionRef.current.facingRight,
            });
          }
        });

      channelRef.current = channel;
    };

    setupPresence();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [groupId]);

  // Re-track presence when avatar loads
  useEffect(() => {
    if (channelRef.current && myAvatar) {
      channelRef.current.track({
        avatarConfig: myAvatar,
        x: myPositionRef.current.x,
        facingRight: myPositionRef.current.facingRight,
      });
    }
  }, [myAvatar]);

  // Callback to update presence when position changes
  const handlePositionChange = useCallback((x: number, facingRight: boolean) => {
    myPositionRef.current = { x, facingRight };

    if (channelRef.current) {
      channelRef.current.track({
        avatarConfig: myAvatar,
        x,
        facingRight,
      });
    }
  }, [myAvatar]);

  const loadStatus = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // Load regular prompt status
      const { data, error } = await supabase.rpc("get_group_status", { p_group_id: groupId });
      if (error) throw error;
      setStatus(data as GroupStatus);

      // Load quiplash assignment (for submitting)
      const quiplash = await getMyQuiplash(groupId);
      setQuiplashAssignment(quiplash);

      // Load quiplash matchups for voting (mid-week voting)
      const matchups = await getQuiplashMatchups(groupId);
      // Filter to only matchups user can vote on and hasn't voted yet
      const votable = matchups.filter(m => m.can_vote && !m.has_voted && m.responses.length >= 2);
      setPendingQuiplashVotes(votable);

      // Load telephone assignment
      const telephone = await getMyTelephone(groupId);
      setTelephoneAssignment(telephone);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? String(e));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadGroupInfo = useCallback(async () => {
    if (!groupId) return;
    try {
      // Load group details including streak
      const { data, error } = await supabase
        .from("groups")
        .select("name, code, created_at, current_streak")
        .eq("id", groupId)
        .single();
      if (!error && data) {
        setGroupName(data.name);
        setGroupCode(data.code);
        setGroupCreatedAt(data.created_at);
        setGroupStreak(data.current_streak || 0);
      }

      // Load user's individual streak
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_streak")
          .eq("id", userData.user.id)
          .single();
        if (profile) {
          setUserStreak(profile.current_streak || 0);
        }
      }

      // Load all group members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (membersError) {
        console.error("Error loading members:", membersError);
      }

      if (members && members.length > 0) {
        setMemberCount(members.length);

        // Fetch profiles for all members
        const userIds = members.map((m: any) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, avatar_config")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error loading profiles:", profilesError);
        }

        // Combine member data with avatars
        const membersWithAvatars = members.map((m: any) => {
          const profile = profiles?.find((p: any) => p.id === m.user_id);
          return {
            user_id: m.user_id,
            avatar_config: profile?.avatar_config as CharacterConfig | null,
          };
        });
        setAllMembers(membersWithAvatars);
      } else {
        // Fallback: at least try to get the count
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId);
        if (count !== null) setMemberCount(count);
      }

      // Load my avatar (for walking character) - userData already loaded above
      if (userData?.user) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("avatar_config")
          .eq("id", userData.user.id)
          .single();
        if (myProfile?.avatar_config) {
          setMyAvatar(myProfile.avatar_config as CharacterConfig);
        }
      }
    } catch {
      // Ignore - not critical
    }
  }, [groupId]);

  // Helper functions for settings modal
  const copyCode = async () => {
    if (!groupCode) return;
    await Clipboard.setStringAsync(groupCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!groupCode || !groupName) return;
    try {
      await Share.share({
        message: `Join my circle "${groupName}" on Stokie! Use code: ${groupCode}`,
      });
    } catch (e) {
      // User cancelled
    }
  };

  const leaveGroup = async () => {
    Alert.alert(
      "Leave Circle?",
      "Are you sure you want to leave this circle? You can rejoin later with the invite code.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setLeaving(true);
            try {
              const { data: userData } = await supabase.auth.getUser();
              if (!userData?.user) throw new Error("Not logged in");

              const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", groupId)
                .eq("user_id", userData.user.id);

              if (error) throw error;

              // Verify the delete actually happened
              const { data: verifyData } = await supabase
                .from("group_members")
                .select("id")
                .eq("group_id", groupId)
                .eq("user_id", userData.user.id)
                .maybeSingle();

              if (verifyData) {
                throw new Error("Failed to leave - please try again");
              }

              setShowSettingsModal(false);
              // Navigate to home with refresh timestamp to force data reload
              // Use the href object form for expo-router
              router.replace({
                pathname: "/(tabs)",
                params: { refresh: Date.now().toString() }
              });
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Failed to leave circle");
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  }, [loadStatus]);

  useEffect(() => {
    loadStatus();
    loadGroupInfo();
  }, [loadStatus, loadGroupInfo]);

  const handleSubmitted = () => {
    loadStatus();
  };

  const handleExpired = () => {
    loadStatus();
  };

  if (!groupId) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18 }}>
        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
          Missing group id. Go back and tap the group again.
        </Text>
        <Text style={{ color: MUTED, marginTop: 12 }}>Debug params: {JSON.stringify(params)}</Text>
      </ScrollView>
    );
  }

  // Check if prompts are still active (not expired)
  const now = new Date();

  // IMPORTANT: The 3 states we want to show:
  // 1. PROMPT ACTIVE (unanswered): Show the prompt card with timer
  // 2. SUBMITTED (before midnight): Show "You submitted!" message
  // 3. NOTHING (no active prompt or after midnight): Show "Nothing here, go touch grass"

  // Check if there's a regular prompt (non-quiplash) that the user hasn't answered yet
  // active_prompt_instance is ONLY returned if user hasn't responded to it
  const hasRegularPrompt = active && !isQuiplashPrompt;

  // Check if there's a quiplash the user hasn't answered yet
  const hasQuiplash = quiplashAssignment?.has_assignment;
  const isQuiplashActive = quiplashAssignment?.expires_at && new Date(quiplashAssignment.expires_at) > now;
  const hasUnansweredQuiplash = hasQuiplash && !quiplashAssignment?.has_responded && isQuiplashActive;

  // Check if there's a telephone assignment
  const hasTelephoneAssignment = telephoneAssignment?.has_assignment === true;

  // Is there ANY prompt the user needs to answer?
  const hasUnansweredPrompt = hasRegularPrompt || hasUnansweredQuiplash || hasTelephoneAssignment;

  // Check if we should show "submitted" state
  // This should ONLY show if:
  // 1. User has responded to the current day's prompt (hasResponded is true from RPC)
  // 2. The prompt hasn't expired yet (still before midnight)
  // NOTE: active_prompt_instance is NULL if user responded, but active_expires_at is still set
  const isBeforeMidnight = status?.active_expires_at && new Date(status.active_expires_at) > now;

  // hasResponded from RPC means user responded to TODAY's prompt
  // We only show "submitted" if they responded AND it's before midnight
  const showRespondedState = hasResponded && isBeforeMidnight;

  // Show empty/responded view when there are no unanswered prompts AND no pending votes
  const hasPendingVotes = pendingQuiplashVotes.length > 0;
  const shouldShowEmptyOrRespondedView = !loading && !hasUnansweredPrompt && !hasPendingVotes;

  if (shouldShowEmptyOrRespondedView) {
    return (
      <WeatherBackground>
        {/* Streak logs on grass */}
        <StreakLogs streak={userStreak} />
        {/* Other users on this screen */}
        {otherUsers.map((user) => (
          <OtherUserCharacter key={user.userId} presence={user} />
        ))}
        {/* Walking character */}
        <UserWalkingCharacter onPositionChange={handlePositionChange} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingTop: 60, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MUTED} />
          }
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                padding: 10,
                backgroundColor: CARD,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
                marginRight: 12,
              }}
            >
              <PixelBackIcon size={22} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <FireText>
                  {groupName ?? "Group"}
                </FireText>
                <FireStreakBadge streak={groupStreak} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {/* Show all member avatars */}
                {allMembers.slice(0, 6).map((member, idx) => (
                  <View key={member.user_id} style={{ marginLeft: idx > 0 ? -6 : 0, zIndex: allMembers.length - idx }}>
                    <PixelCharacter
                      config={member.avatar_config || DEFAULT_CHARACTER}
                      size={22}
                    />
                  </View>
                ))}
                {allMembers.length > 6 && (
                  <Text style={{ color: MUTED, fontSize: 11, marginLeft: 4 }}>
                    +{allMembers.length - 6}
                  </Text>
                )}
                <Text style={{ color: MUTED, fontSize: 12, opacity: 0.6, marginLeft: 6 }}>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setCodeCopied(false);
                setShowSettingsModal(true);
              }}
              style={{
                padding: 10,
                backgroundColor: CARD,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <PixelGearIcon size={22} />
            </Pressable>
          </View>

          {/* Sunday States */}
          {sundayState === 'pre-fireside' && (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <DetailedCampfire size={80} showSmoke={false} />
                <Text style={{ color: "#FFD93D", fontSize: 24, fontWeight: "900", marginTop: 16, textAlign: "center" }}>
                  Fireside is tonight!
                </Text>
                <Text style={{ color: TEXT, fontSize: 18, marginTop: 12, textAlign: "center" }}>
                  at {getFiresideLocalTime()}
                </Text>
                <Text style={{ color: MUTED, fontSize: 16, marginTop: 16, textAlign: "center", fontStyle: "italic" }}>
                  Bring mellow.
                </Text>
              </View>
            </Card>
          )}

          {sundayState === 'during-fireside' && (
            <BigFiresideButton onPress={() => router.push(`/group/${groupId}/lowdown`)} />
          )}

          {sundayState === 'post-fireside' && (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🌙</Text>
                <Text style={{ color: "#4ADE80", fontSize: 24, fontWeight: "900", textAlign: "center" }}>
                  Great week!
                </Text>
                <Text style={{ color: TEXT, fontSize: 18, marginTop: 16, textAlign: "center" }}>
                  Get your 8 hours champ
                </Text>
                <Text style={{ color: MUTED, fontSize: 16, marginTop: 8, textAlign: "center" }}>
                  and remember to floss.
                </Text>
              </View>
            </Card>
          )}

          {/* Non-Sunday States */}
          {sundayState === 'not-sunday' && (
            <>
              <Card>
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  {showRespondedState ? (
                    <>
                      <View style={{ marginBottom: 8 }}>
                        <DetailedCampfire size={70} showSmoke={false} />
                      </View>
                      <Text style={{ color: "#4ADE80", fontSize: 22, fontWeight: "900", marginTop: 8, textAlign: "center" }}>
                        Relax, you already submitted.
                      </Text>
                      <Text style={{ color: MUTED, fontSize: 16, marginTop: 8, textAlign: "center" }}>
                        Go call your mom.
                      </Text>
                    </>
                  ) : (
                    <>
                      <DetailedGrass size={60} variant={1} />
                      <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900", marginTop: 16, textAlign: "center" }}>
                        Nothing here.
                      </Text>
                      <Text style={{ color: MUTED, fontSize: 16, marginTop: 8, textAlign: "center" }}>
                        Go touch some grass.
                      </Text>
                    </>
                  )}
                </View>

                <View style={{ marginTop: 16 }}>
                  <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />
                </View>
              </Card>

              {/* Fireside Button - only show during fireside hours (fallback for non-sunday testing) */}
              {showFireside && (
                <BigFiresideButton onPress={() => router.push(`/group/${groupId}/lowdown`)} />
              )}
            </>
          )}
        </ScrollView>

        {/* Settings Modal */}
        <Modal
          visible={showSettingsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            justifyContent: "flex-end",
          }}>
            <View style={{
              backgroundColor: BG,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: BORDER,
              padding: 24,
              paddingBottom: 40,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>
                  Circle Settings
                </Text>
                <Pressable
                  onPress={() => setShowSettingsModal(false)}
                  style={{
                    padding: 8,
                    backgroundColor: CARD,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>X</Text>
                </Pressable>
              </View>

              {/* Invite Code Section */}
              <View style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}>
                <Text style={{ color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
                  INVITE CODE
                </Text>
                <View style={{
                  backgroundColor: "rgba(10, 16, 32, 0.9)",
                  borderColor: BTN_ORANGE,
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  alignItems: "center",
                }}>
                  <Text style={{
                    color: TEXT,
                    fontSize: 28,
                    fontWeight: "900",
                    letterSpacing: 4,
                    fontFamily: "monospace",
                  }}>
                    {groupCode || "------"}
                  </Text>
                </View>

                {/* Copy and Share buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={copyCode}
                    style={{
                      flex: 1,
                      backgroundColor: codeCopied ? "#4ADE80" : "transparent",
                      borderColor: codeCopied ? "#4ADE80" : BORDER,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <PixelCopyIcon size={16} />
                    <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                      {codeCopied ? "Copied!" : "Copy"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={shareCode}
                    style={{
                      flex: 1,
                      backgroundColor: BTN_ORANGE,
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <PixelShareIcon size={16} />
                    <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Group Info */}
              <View style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <PixelPersonIcon size={20} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>MEMBERS</Text>
                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                      {memberCount} {memberCount === 1 ? "person" : "people"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <PixelCalendarIcon size={20} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>STARTED</Text>
                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                      {formatDate(groupCreatedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Leave Group Button */}
              <Pressable
                onPress={leaveGroup}
                disabled={leaving}
                style={{
                  backgroundColor: "transparent",
                  borderColor: DANGER,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: leaving ? 0.5 : 1,
                }}
              >
                <PixelDoorIcon size={20} />
                <Text style={{ color: DANGER, fontWeight: "700", fontSize: 14 }}>
                  {leaving ? "Leaving..." : "Leave Circle"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </WeatherBackground>
    );
  }

  return (
    <WeatherBackground>
      {/* Streak logs on grass */}
      <StreakLogs streak={userStreak} />
      {/* Walking character */}
      <UserWalkingCharacter />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingTop: 60, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MUTED} />
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 10,
              backgroundColor: CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER,
              marginRight: 12,
            }}
          >
            <PixelBackIcon size={22} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <FireText>
                {groupName ?? "Group"}
              </FireText>
              <FireStreakBadge streak={groupStreak} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {/* Show all member avatars */}
              {allMembers.slice(0, 6).map((member, idx) => (
                <View key={member.user_id} style={{ marginLeft: idx > 0 ? -6 : 0, zIndex: allMembers.length - idx }}>
                  <PixelCharacter
                    config={member.avatar_config || DEFAULT_CHARACTER}
                    size={22}
                  />
                </View>
              ))}
              {allMembers.length > 6 && (
                <Text style={{ color: MUTED, fontSize: 11, marginLeft: 4 }}>
                  +{allMembers.length - 6}
                </Text>
              )}
              <Text style={{ color: MUTED, fontSize: 12, opacity: 0.6, marginLeft: 6 }}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setCodeCopied(false);
              setShowSettingsModal(true);
            }}
            style={{
              padding: 10,
              backgroundColor: CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
            <PixelGearIcon size={22} />
          </Pressable>
        </View>

        {loading ? (
          <Card>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
              Loading...
            </Text>
          </Card>
        ) : (
          <>
            {/* Regular prompt (non-quiplash) */}
            {hasRegularPrompt && (
              <PromptCard
                groupPrompt={active as GroupPrompt}
                groupId={groupId}
                hasResponded={hasResponded}
                hasRated={hasRated}
                userRating={userRating}
                onSubmitted={handleSubmitted}
                onExpired={handleExpired}
              />
            )}

            {/* Quiplash prompt (separate card) - only show if unanswered */}
            {hasUnansweredQuiplash && (
              <>
                {hasRegularPrompt && <View style={{ height: 16 }} />}
                <QuiplashCard groupId={groupId} onSubmitted={handleSubmitted} />
              </>
            )}

            {/* Quiplash voting (mid-week) */}
            {pendingQuiplashVotes.length > 0 && (
              <>
                {(hasRegularPrompt || hasUnansweredQuiplash) && <View style={{ height: 16 }} />}
                <QuiplashVotingCard groupId={groupId} onVoted={handleSubmitted} />
              </>
            )}

            {/* Telephone game drawing/writing */}
            {hasTelephoneAssignment && telephoneAssignment && (
              <>
                {(hasRegularPrompt || hasUnansweredQuiplash || pendingQuiplashVotes.length > 0) && <View style={{ height: 16 }} />}
                <TelephoneCard
                  assignment={telephoneAssignment}
                  groupId={groupId}
                  onSubmitted={handleSubmitted}
                />
              </>
            )}
          </>
        )}

        <View style={{ height: 12 }} />
        <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />

        {/* Fireside Button - only show during fireside hours */}
        {showFireside && (
          <BigFiresideButton onPress={() => router.push(`/group/${groupId}/lowdown`)} />
        )}
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "flex-end",
        }}>
          <View style={{
            backgroundColor: BG,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: BORDER,
            padding: 24,
            paddingBottom: 40,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>
                Circle Settings
              </Text>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                style={{
                  padding: 8,
                  backgroundColor: CARD,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>X</Text>
              </Pressable>
            </View>

            {/* Invite Code Section */}
            <View style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{ color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
                INVITE CODE
              </Text>
              <View style={{
                backgroundColor: "rgba(10, 16, 32, 0.9)",
                borderColor: BTN_ORANGE,
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 12,
                alignItems: "center",
              }}>
                <Text style={{
                  color: TEXT,
                  fontSize: 28,
                  fontWeight: "900",
                  letterSpacing: 4,
                  fontFamily: "monospace",
                }}>
                  {groupCode || "------"}
                </Text>
              </View>

              {/* Copy and Share buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={copyCode}
                  style={{
                    flex: 1,
                    backgroundColor: codeCopied ? "#4ADE80" : "transparent",
                    borderColor: codeCopied ? "#4ADE80" : BORDER,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <PixelCopyIcon size={16} />
                  <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                    {codeCopied ? "Copied!" : "Copy"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={shareCode}
                  style={{
                    flex: 1,
                    backgroundColor: BTN_ORANGE,
                    borderRadius: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <PixelShareIcon size={16} />
                  <Text style={{ color: TEXT, fontWeight: "700", fontSize: 14 }}>
                    Share
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Group Info */}
            <View style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <PixelPersonIcon size={20} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>MEMBERS</Text>
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                    {memberCount} {memberCount === 1 ? "person" : "people"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <PixelCalendarIcon size={20} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: MUTED, fontSize: 11, fontWeight: "600" }}>STARTED</Text>
                  <Text style={{ color: TEXT, fontSize: 18, fontWeight: "700" }}>
                    {formatDate(groupCreatedAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Leave Group Button */}
            <Pressable
              onPress={leaveGroup}
              disabled={leaving}
              style={{
                backgroundColor: "transparent",
                borderColor: DANGER,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: leaving ? 0.5 : 1,
              }}
            >
              <PixelDoorIcon size={20} />
              <Text style={{ color: DANGER, fontWeight: "700", fontSize: 14 }}>
                {leaving ? "Leaving..." : "Leave Circle"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </WeatherBackground>
  );
}
