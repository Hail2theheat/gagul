import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

const C = {
  bg: "#000000",
  card: "#0B1220",
  border: "#1E3A8A",
  text: "#93C5FD",
  dim: "#60A5FA",
  btn: "#1D4ED8",
  btnText: "#DBEAFE",
  inputBg: "#050A14",
};

export default function Settings() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refreshSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) Alert.alert("Session error", error.message);
    setSessionEmail(data.session?.user?.email ?? null);
  }

  useEffect(() => {
    refreshSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!email.trim() || !password) return Alert.alert("Missing", "Email + password required");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) Alert.alert("Sign in failed", error.message);
    else await refreshSession();
  };

  const signUp = async () => {
    if (!email.trim() || !password) return Alert.alert("Missing", "Email + password required");
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) Alert.alert("Sign up failed", error.message);
    else Alert.alert("Signed up", "If email confirmation is on, confirm your email then sign in.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out failed", error.message);
    else {
      setSessionEmail(null);
      Alert.alert("Signed out");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, gap: 14 }}>
      <Text style={{ color: C.text, fontSize: 24, fontWeight: "800" }}>Settings</Text>

      <Text style={{ color: C.dim }}>
        Session email: {sessionEmail ?? "(none)"}
      </Text>

      <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }}>
        <Text style={{ color: C.text, fontWeight: "800" }}>Sign in / sign up</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email"
          placeholderTextColor={C.dim}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ backgroundColor: C.inputBg, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12, color: C.text }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="password"
          placeholderTextColor={C.dim}
          secureTextEntry
          style={{ backgroundColor: C.inputBg, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12, color: C.text }}
        />

        <Pressable onPress={signIn} style={{ backgroundColor: C.btn, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: C.btnText, fontWeight: "800" }}>Sign in</Text>
        </Pressable>

        <Pressable onPress={signUp} style={{ borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: C.text, fontWeight: "800" }}>Sign up</Text>
        </Pressable>

        <Pressable onPress={refreshSession} style={{ borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: C.text, fontWeight: "800" }}>Refresh session</Text>
        </Pressable>

        <Pressable onPress={signOut} style={{ borderColor: "#7f1d1d", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: "#FCA5A5", fontWeight: "800" }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
