// lib/promptFlow.ts
import { supabase } from "./supabase";

export type PromptRow = {
  id: string;
  title: string;
  type: string;
  payload: any;
  is_active: boolean;
  created_at?: string;
};

export type PromptInstanceRow = {
  id: string;
  group_id: string;
  prompt_id: string;
  starts_at: string;
  week_key: string;
  created_at?: string;
  prompts?: PromptRow;
};

function getWeekKey(d = new Date()) {
  // ISO week key like 2026-W03
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const w = String(weekNo).padStart(2, "0");
  return `${date.getUTCFullYear()}-W${w}`;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error("Auth session missing");
  return uid;
}

export async function getLatestPromptInstance(groupId: string) {
  const { data, error } = await supabase
    .from("prompt_instances")
    .select("id, group_id, prompt_id, starts_at, week_key, created_at, prompts:prompts(id,title,type,payload,is_active,created_at)")
    .eq("group_id", groupId)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PromptInstanceRow | null;
}

export async function createPromptInstance(groupId: string) {
  await requireUserId();

  // pick a random active prompt
  const { data: prompts, error: pErr } = await supabase
    .from("prompts")
    .select("id,title,type,payload,is_active,created_at")
    .eq("is_active", true);

  if (pErr) throw pErr;
  if (!prompts || prompts.length === 0) throw new Error("prompts is empty");

  const chosen = prompts[Math.floor(Math.random() * prompts.length)] as PromptRow;

  const starts_at = new Date().toISOString();
  const week_key = getWeekKey(new Date());

  const { data: inst, error: iErr } = await supabase
    .from("prompt_instances")
    .insert({
      group_id: groupId,
      prompt_id: chosen.id,
      starts_at,
      week_key,
    })
    .select("id, group_id, prompt_id, starts_at, week_key, created_at")
    .single();

  if (iErr) throw iErr;
  return inst as PromptInstanceRow;
}

/**
 * Ensures there is at least one prompt_instance for the group.
 * Returns the latest instance after ensuring.
 */
export async function ensureLatestPromptInstance(groupId: string) {
  const latest = await getLatestPromptInstance(groupId);
  if (latest) return latest;
  await createPromptInstance(groupId);
  return await getLatestPromptInstance(groupId);
}
