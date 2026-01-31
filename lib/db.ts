import { supabase } from "./supabase";

export function makeGroupCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function getMyUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user.id;
}

export async function getMyGroups() {
  const uid = await getMyUserId();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, groups:groups(id,name,code,owner_id,created_at)")
    .eq("user_id", uid);

  if (error) throw error;
  // normalize
  return (data ?? [])
    .map((row: any) => row.groups)
    .filter(Boolean);
}

export async function createGroup(name: string) {
  const uid = await getMyUserId();

  // try a few codes in case of collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeGroupCode(6);

    const { data: g, error: gErr } = await supabase
      .from("groups")
      .insert({ name, code, owner_id: uid })
      .select()
      .single();

    if (gErr) {
      // unique collision -> retry
      if ((gErr as any).code === "23505") continue;
      throw gErr;
    }

    const { error: mErr } = await supabase
      .from("group_members")
      .insert({ group_id: g.id, user_id: uid, role: "owner" });

    if (mErr) throw mErr;

    return g;
  }

  throw new Error("Failed to generate unique group code");
}

export async function joinGroupByCode(code: string) {
  const uid = await getMyUserId();

  const { data: g, error: gErr } = await supabase
    .from("groups")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (gErr) throw gErr;

  const { error: mErr } = await supabase
    .from("group_members")
    .insert({ group_id: g.id, user_id: uid, role: "member" });

  if (mErr) throw mErr;

  return g;
}
