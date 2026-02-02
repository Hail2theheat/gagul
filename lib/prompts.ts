/**
 * @deprecated This file is deprecated. Use lib/services/promptService.ts instead.
 * This file is kept for backwards compatibility during migration.
 */

import { supabase } from "./supabase";

/**
 * This version assumes your real schema:
 * prompts: (id, title, type, payload(jsonb), is_active, created_at)
 * prompt_instances: (id, group_id, prompt_id, starts_at, week_key, created_at)
 * responses: (id, prompt_instance_id, group_id, user_id, type, content(jsonb), created_at)
 *
 * IMPORTANT: We do NOT create prompt_instances in the app anymore.
 * The Edge Function schedule_prompts creates them for the week.
 */

const TZ = "America/New_York";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error("Auth session missing!");
  return uid;
}

export type PromptRow = {
  id: string;
  title: string | null;
  type: string;
  payload: any;
  is_active: boolean | null;
  created_at: string;
};

export type PromptInstanceRow = {
  id: string;
  group_id: string;
  prompt_id: string;
  starts_at: string;   // ISO string
  week_key: string | null;
  created_at: string;
  prompts?: PromptRow; // when joined
};

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Returns the current live prompt instance for a group:
 * - starts_at <= now
 * - latest by starts_at desc
 */
export async function getLivePromptInstance(groupId: string): Promise<PromptInstanceRow | null> {
  await requireUserId();

  const now = nowIso();

  const { data, error } = await supabase
    .from("prompt_instances")
    .select(
      `
      id, group_id, prompt_id, starts_at, week_key, created_at,
      prompts:prompts ( id, title, type, payload, is_active, created_at )
    `
    )
    .eq("group_id", groupId)
    .lte("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0] as any;
}

/**
 * Returns the next upcoming prompt instance for a group:
 * - starts_at > now
 * - earliest by starts_at asc
 */
export async function getNextPromptInstance(groupId: string): Promise<PromptInstanceRow | null> {
  await requireUserId();

  const now = nowIso();

  const { data, error } = await supabase
    .from("prompt_instances")
    .select(
      `
      id, group_id, prompt_id, starts_at, week_key, created_at,
      prompts:prompts ( id, title, type, payload, is_active, created_at )
    `
    )
    .eq("group_id", groupId)
    .gt("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0] as any;
}

/**
 * Submit ONE response row.
 * type must match your DB check constraint (you said it now works):
 * likely allowed: "text" | "photo" | "poll" | "video" (depending on your constraint)
 *
 * content is jsonb, examples:
 *  - text:  { text: "hello", photo_url?: "...", storage_path?: "..." }
 *  - photo: { photo_url: "...", storage_path: "...", text?: "caption" }
 *  - poll:  { choice: "A" }
 */
export async function submitResponse(args: {
  promptInstanceId: string;
  groupId: string;
  type: "text" | "photo" | "poll" | "video";
  content: any;
}): Promise<void> {
  const uid = await requireUserId();

  const { error } = await supabase.from("responses").insert({
    prompt_instance_id: args.promptInstanceId,
    group_id: args.groupId,
    user_id: uid,
    type: args.type,
    content: args.content,
  });

  if (error) throw error;
}

/**
 * Helper for the UI: decide what to show.
 * - If live prompt exists: return it
 * - Else return next prompt (for countdown display)
 */
export async function getPromptForGroup(groupId: string): Promise<{
  live: PromptInstanceRow | null;
  next: PromptInstanceRow | null;
}> {
  const live = await getLivePromptInstance(groupId);
  if (live) return { live, next: null };
  const next = await getNextPromptInstance(groupId);
  return { live: null, next };
}

/**
 * Lowdown unlock gate: Sunday 8pm ET.
 * Client-only gate for now (later we can enforce server-side too).
 */
export function isLowdownUnlockedNow(): boolean {
  // Convert "now" into ET weekday/hour using Intl
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((acc: any, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const weekday = parts.weekday as string; // "Sun", "Mon", ...
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);

  // Sunday 20:00 or later
  if (weekday !== "Sun") return false;
  if (hour > 20) return true;
  if (hour < 20) return false;
  return minute >= 0;
}

/**
 * Pretty formatter for a starts_at ISO string.
 */
export function formatStartsAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
