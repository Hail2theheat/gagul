// app/group/[id]/index.tsx
import * as ImagePicker from "expo-image-picker";
import { useGlobalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { supabase } from "../../../lib/supabase";

const BG = "#070B14";
const CARD = "#0D1426";
const BORDER = "#27406B";
const TEXT = "#E6F0FF";
const MUTED = "#9EC5FF";
const BTN = "#1E4ED8";

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

function Input(props: any) {
  return (
    <TextInput
      placeholderTextColor={"#5E7BB3"}
      {...props}
      style={[
        {
          backgroundColor: "#0A1020",
          borderColor: BORDER,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: MUTED,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}

async function uriToArrayBuffer(uri: string) {
  const res = await fetch(uri);
  if (!res.ok) throw new Error("Failed to read image file");
  return await res.arrayBuffer();
}

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

export default function GroupScreen() {
  const params = useGlobalSearchParams();
  const raw = (params as any)?.id ?? (params as any)?.Id;
  const groupId = typeof raw === "string" ? raw : undefined;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [responseText, setResponseText] = useState("");
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const timerRef = useRef<any>(null);

  const active = status?.active_prompt_instance ?? null;
  const activeExpiresAt = status?.active_expires_at ? new Date(status.active_expires_at) : null;

  const prompt = active?.prompts ?? null;

  const promptQuestion =
    prompt?.payload?.question ?? prompt?.payload?.text ?? prompt?.title ?? "(no prompt loaded)";

  const pollChoices: any[] =
    prompt?.type === "poll"
      ? Array.isArray(prompt?.payload?.choices)
        ? prompt.payload.choices
        : []
      : [];

  const canSubmit = useMemo(() => {
    if (!groupId || !active) return false;
    if (!prompt) return false;
    if (prompt.type === "poll") return false;
    const hasText = responseText.trim().length > 0;
    const hasPhoto = !!pickedUri;
    return hasText || hasPhoto;
  }, [groupId, active, prompt, responseText, pickedUri]);

  async function loadStatus() {
    if (!groupId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_group_status", { p_group_id: groupId });
      if (error) throw error;
      setStatus(data);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? String(e));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Countdown timer (only when active prompt exists)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!active || !activeExpiresAt) {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => {
      const ms = activeExpiresAt.getTime() - Date.now();
      setTimeLeftMs(ms);
      if (ms <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        loadStatus();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, status?.active_expires_at]);

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setPickedUri(uri);
    } catch (e: any) {
      Alert.alert("Photo pick failed", e?.message ?? String(e));
    }
  }

  function clearPhoto() {
    setPickedUri(null);
  }

  async function submitCombined() {
    if (!groupId || !active) return;

    // Hard stop if expired
    if (activeExpiresAt && Date.now() >= activeExpiresAt.getTime()) {
      Alert.alert("Expired", "This prompt expired at midnight ET.");
      await loadStatus();
      return;
    }

    const text = responseText.trim();
    const hasText = text.length > 0;
    const hasPhoto = !!pickedUri;

    if (!hasText && !hasPhoto) return;

    setSubmitting(true);
    try {
      const { data: userData, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const uid = userData.user?.id;
      if (!uid) throw new Error("Auth session missing");

      // Upload photo (if any)
      let storage_path: string | null = null;
      let photo_url: string | null = null;

      if (pickedUri) {
        const fileName = `${Date.now()}.jpg`;
        storage_path = `${groupId}/${active.id}/${uid}/${fileName}`;

        const bytes = await uriToArrayBuffer(pickedUri);

        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(storage_path, bytes, { contentType: "image/jpeg", upsert: false });

        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("uploads").getPublicUrl(storage_path);
        photo_url = pub?.publicUrl ?? null;
      }

      // Build content json (can contain both)
      const content: any = {};
      if (hasText) content.text = text;
      if (storage_path) content.storage_path = storage_path;
      if (photo_url) content.photo_url = photo_url;

      // IMPORTANT: use ONLY allowed types
      // If both text+photo: classify as "text" (photo info still stored in content)
      const type = hasText ? "text" : "photo";

      const { error: insErr } = await supabase.from("responses").insert({
        prompt_instance_id: active.id,
        group_id: groupId,
        user_id: uid,
        type,
        content,
      });

      if (insErr) throw insErr;

      setResponseText("");
      setPickedUri(null);

      // Immediately hide prompt (your requirement)
      await loadStatus();
    } catch (e: any) {
      Alert.alert("Submit failed", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPollChoice(choice: any) {
    if (!groupId || !active) return;

    // Hard stop if expired
    if (activeExpiresAt && Date.now() >= activeExpiresAt.getTime()) {
      Alert.alert("Expired", "This prompt expired at midnight ET.");
      await loadStatus();
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const uid = userData.user?.id;
      if (!uid) throw new Error("Auth session missing");

      const { error } = await supabase.from("responses").insert({
        prompt_instance_id: active.id,
        group_id: groupId,
        user_id: uid,
        type: "poll",
        content: { choice },
      });

      if (error) throw error;

      await loadStatus();
    } catch (e: any) {
      Alert.alert("Vote failed", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

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

  // No active prompt (or already answered) => touch grass
  if (!loading && !active) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18 }}>
        <Text style={{ color: MUTED, fontSize: 28, fontWeight: "900", marginBottom: 12 }}>
          Group
        </Text>

        <Card>
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: "900", marginBottom: 10 }}>
            no prompts at this time, relax. Go touch some grass.
          </Text>

          <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: MUTED, fontSize: 28, fontWeight: "900", marginBottom: 12 }}>Group</Text>

      <Card>
        <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900", marginBottom: 8 }}>
          {loading ? "(loading...)" : promptQuestion}
        </Text>

        {!!activeExpiresAt && (
          <Text style={{ color: MUTED, marginBottom: 12, fontWeight: "700" }}>
            Time left: {formatMs(timeLeftMs)} (expires midnight ET)
          </Text>
        )}

        {prompt?.type === "poll" && pollChoices.length > 0 ? (
          <View style={{ gap: 10 }}>
            {pollChoices.map((c, idx) => (
              <Button
                key={`${idx}-${String(c)}`}
                title={String(c)}
                onPress={() => submitPollChoice(c)}
                disabled={submitting || !active}
              />
            ))}
            <View style={{ height: 10 }} />
            <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />
          </View>
        ) : (
          <>
            <Input
              placeholder="Type your response..."
              value={responseText}
              onChangeText={setResponseText}
              multiline
              style={{ minHeight: 90, textAlignVertical: "top", marginBottom: 12 }}
            />

            <Button
              title={pickedUri ? "Change photo" : "Add photo"}
              variant="outline"
              onPress={pickPhoto}
              disabled={submitting}
            />

            {pickedUri && (
              <>
                <View style={{ height: 10 }} />
                <Image
                  source={{ uri: pickedUri }}
                  style={{
                    width: "100%",
                    height: 240,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: BORDER,
                  }}
                  resizeMode="cover"
                />
                <View style={{ height: 10 }} />
                <Button
                  title="Remove photo"
                  variant="outline"
                  onPress={clearPhoto}
                  disabled={submitting}
                />
              </>
            )}

            <View style={{ height: 14 }} />

            <Button
              title={submitting ? "Submitting..." : "Submit"}
              onPress={submitCombined}
              disabled={!canSubmit || submitting}
            />

            <View style={{ height: 12 }} />
            <Button title="Refresh" variant="outline" onPress={loadStatus} disabled={loading} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}
