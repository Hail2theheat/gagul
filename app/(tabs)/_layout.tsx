// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

// Pixel art home icon
function PixelHomeIcon({ color, size }: { color: string; size: number }) {
  const s = size * 0.08;
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0B1026",
          borderTopColor: "#1a2f1a",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "#6B5B4F",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <PixelHomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // This hides the tab
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <PixelGearIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
