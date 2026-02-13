// app/(tabs)/_layout.tsx
import { Tabs, router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { HapticTab } from "../../components/haptic-tab";
import { SPRING_BOUNCY } from "../../constants/animations";
import { useFireNavigation } from "../../components/FireNavigationProvider";

// Animated tab icon wrapper - scales up when active
function AnimatedTabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, SPRING_BOUNCY);
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  );
}

// Pixel art home icon
function PixelHomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Roof */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.45,
        borderRightWidth: size * 0.45,
        borderBottomWidth: size * 0.35,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
        marginBottom: -2,
      }} />
      {/* House body */}
      <View style={{
        width: size * 0.7,
        height: size * 0.4,
        backgroundColor: color,
      }}>
        {/* Door */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          marginLeft: -size * 0.12,
          width: size * 0.24,
          height: size * 0.25,
          backgroundColor: "#0B1026",
          borderTopLeftRadius: size * 0.05,
          borderTopRightRadius: size * 0.05,
        }} />
      </View>
    </View>
  );
}

// Pixel art gear/settings icon
function PixelGearIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Center circle */}
      <View style={{
        width: size * 0.4,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: size * 0.2,
        position: "absolute",
      }} />
      {/* Teeth */}
      <View style={{ width: size * 0.2, height: size * 0.9, backgroundColor: color, position: "absolute" }} />
      <View style={{ width: size * 0.9, height: size * 0.2, backgroundColor: color, position: "absolute" }} />
      <View style={{ width: size * 0.2, height: size * 0.7, backgroundColor: color, position: "absolute", transform: [{ rotate: "45deg" }] }} />
      <View style={{ width: size * 0.7, height: size * 0.2, backgroundColor: color, position: "absolute", transform: [{ rotate: "45deg" }] }} />
      {/* Center hole */}
      <View style={{
        width: size * 0.18,
        height: size * 0.18,
        backgroundColor: "#0B1026",
        borderRadius: size * 0.09,
        position: "absolute",
      }} />
    </View>
  );
}

export default function TabLayout() {
  const { navigateWithFire } = useFireNavigation();
  // Track which tab is currently active so we skip fire when tapping the same tab
  const activeTab = useRef("index");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#080E1C",
          borderTopColor: "rgba(80, 100, 140, 0.2)",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#FF8555",
        tabBarInactiveTintColor: "#6B6058",
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Paaxel",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <PixelHomeIcon color={color} size={size} />
            </AnimatedTabIcon>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (activeTab.current === "index") return;
            e.preventDefault();
            navigateWithFire(() => {
              activeTab.current = "index";
              navigation.navigate("index");
            });
          },
          focus: () => { activeTab.current = "index"; },
        })}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <PixelGearIcon color={color} size={size} />
            </AnimatedTabIcon>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (activeTab.current === "settings") return;
            e.preventDefault();
            navigateWithFire(() => {
              activeTab.current = "settings";
              navigation.navigate("settings");
            });
          },
          focus: () => { activeTab.current = "settings"; },
        })}
      />
    </Tabs>
  );
}
