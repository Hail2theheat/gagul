// app/(tabs)/index.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { supabase } from "../../lib/supabase";

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

type GroupRow = { id: string; name: string | null; created_at?: string };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error("Auth session missing!");
  return uid;
}

export default function HomeGroupsScreen() {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);

  const [newName, setNewName] = useState("");
  const [joinId, setJoinId] = useState("");

  const canCreate = useMemo(() => newName.trim().length > 0, [newName]);
  const canJoin = useMemo(() => joinId.trim().length > 0, [joinId]);

  async function refresh() {
    setLoading(true);
    try {
      const uid = await requireUserId();

      // 1) memberships
      const { data: mem, error: mErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", uid);

      if (mErr) throw mErr;

      const ids = (mem ?? []).map((r: any) => r.group_id).filter(Boolean);

      if (ids.length === 0) {
        setGroups([]);
        return;
      }

      // 2) groups
      const { data: gs, error: gErr } = await supabase
        .from("groups")
        .select("id,name,created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });

      if (gErr) throw gErr;

      setGroups((gs ?? []) as any);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!canCreate) return;
    setLoading(true);
    try {
      const uid = await requireUserId();
      const name = newName.trim();

      const { data: created, error: cErr } = await supabase
        .from("groups")
        .insert({ name })
        .select("id,name")
        .single();

      if (cErr) throw cErr;

      const { error: mErr } = await supabase.from("group_members").insert({
        group_id: created.id,
        user_id: uid,
      });

      if (mErr) throw mErr;

      setNewName("");
      await refresh();
      Alert.alert("Created", "Group created.");
    } catch (e: any) {
      Alert.alert("Create failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup() {
    if (!canJoin) return;
    setLoading(true);
    try {
      const uid = await requireUserId();
      const gid = joinId.trim();

      const { error } = await supabase.from("group_members").insert({
        group_id: gid,
        user_id: uid,
      });

      if (error) throw error;

      setJoinId("");
      await refresh();
      Alert.alert("Joined", "You joined the group.");
    } catch (e: any) {
      Alert.alert("Join failed", e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function openGroup(id: string) {
    router.push(`/group/${id}`);
  }

  function openLowdown(id: string) {
    router.push(`/group/${id}/lowdown`);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: TEXT, fontSize: 34, fontWeight: "900", marginBottom: 12 }}>
        Your Groups
      </Text>

      <Card>
        <Text style={{ color: MUTED, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          Create a group
        </Text>
        <Input placeholder="Group name" value={newName} onChangeText={setNewName} />
        <View style={{ height: 10 }} />
        <Button title={loading ? "..." : "Create"} onPress={createGroup} disabled={!canCreate || loading} />

        <View style={{ height: 18 }} />

        <Text style={{ color: MUTED, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
          Join a group by ID
        </Text>
        <Input placeholder="Paste group UUID" value={joinId} onChangeText={setJoinId} />
        <View style={{ height: 10 }} />
        <Button title={loading ? "..." : "Join"} onPress={joinGroup} disabled={!canJoin || loading} />

        <View style={{ height: 12 }} />
        <Button title={loading ? "Refreshing..." : "Refresh"} variant="outline" onPress={refresh} disabled={loading} />
      </Card>

<Text style={{ color: TEXT, fontSize: 22, fontWeight: "900", marginTop: 16, marginBottom: 10 }}>
  Your groups
</Text>
      {groups.map((g) => (
        <Card key={g.id}>
          <Pressable onPress={() => openGroup(g.id)} disabled={loading}>
  <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900", marginBottom: 6 }}>
    {g.name ?? "(untitled)"}
  </Text>
</Pressable>

        </Card>
      ))}
    </ScrollView>
  );
}
