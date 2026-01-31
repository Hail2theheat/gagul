import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, Text } from "react-native";

export default function LowdownScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerStyle={{ padding: 18 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Lowdown</Text>
      <Text style={{ marginTop: 12 }}>Group id: {id}</Text>
    </ScrollView>
  );
}
