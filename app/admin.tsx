// app/admin.tsx — Admin Dashboard for weekly prompt management
import { router } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useMyGroups, type GroupRow } from "../lib/hooks/useMyGroups";
import {
  useWeekSchedule,
  usePromptResponses,
  useGroupMemberCount,
  useDeactivatePrompt,
} from "../lib/hooks/useAdminData";
import { getWeekOf, type AdminGroupPrompt, type AdminResponse } from "../lib/services/adminService";
import { getSignedImageUrl } from "../lib/services/firesideService";
import { JUDGE_CONFIGS } from "../components/fireside/judgeConfigs";
import { getPhotoCompletionResults } from "../lib/services/photoCompletionService";
import type { PhotoCompletionPair } from "../lib/types/photoCompletion";
import { supabase } from "../lib/supabase";
import { NightSky } from "../components/sky";
import { PixelTitle } from "../components/PixelTitle";
import { PixelCharacter, DEFAULT_CHARACTER } from "../components/PixelCharacter";
import { CampfireColors, Spacing, Radii, Typography } from "../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const { BG, TEXT_CREAM: TEXT, MUTED, BTN_PRIMARY: BTN, BORDER, CARD_SOLID: CARD, SUCCESS, DANGER } = CampfireColors;

// ─── Prompt type badge colors ────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  short_text: "#4A9EFF",
  long_text: "#7B68EE",
  photo: "#FF6B9D",
  multiple_choice: "#FFA033",
  quiz: "#FFD700",
  quiplash: "#FF4444",
  quiplash_vote: "#FF8C00",
  meme_upload: "#9B59B6",
  meme_caption: "#9B59B6",
  photo_caption: "#FF6B9D",
};

// ─── Helpers ─────────────────────────────────────────────────
function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
}

function formatWeekRange(weekOf: string): string {
  const mon = new Date(weekOf + "T12:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Denver" });
  return `${fmt(mon)} - ${fmt(sun)}`;
}

function promptStatus(gp: AdminGroupPrompt): "active" | "expired" | "upcoming" | "deactivated" {
  if (!gp.is_active) return "deactivated";
  const now = new Date();
  const scheduled = new Date(gp.scheduled_for);
  const expires = new Date(gp.expires_at);
  if (now < scheduled) return "upcoming";
  if (now > expires) return "expired";
  return "active";
}

const STATUS_COLORS = {
  active: SUCCESS,
  expired: MUTED,
  upcoming: "#4A9EFF",
  deactivated: DANGER,
};

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    short_text: "Text",
    long_text: "Long",
    photo: "Photo",
    multiple_choice: "MC",
    quiz: "Quiz",
    quiplash: "Quip Prompt",
    quiplash_vote: "Quip Vote",
    meme_upload: "Meme",
    meme_caption: "Caption",
    photo_caption: "Caption",
  };
  return labels[type] || type;
}

// ─── Group Picker ────────────────────────────────────────────
function GroupPicker({
  groups,
  selected,
  onSelect,
}: {
  groups: GroupRow[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: Spacing.md }}
      contentContainerStyle={{ gap: 8 }}
    >
      {groups.map((g) => {
        const active = g.id === selected;
        return (
          <Pressable
            key={g.id}
            onPress={() => onSelect(g.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: Radii.md,
              backgroundColor: active ? BTN : CARD,
              borderColor: active ? BTN : BORDER,
              borderWidth: 1,
            }}
          >
            <Text style={{ color: active ? "#000" : TEXT, fontFamily: "Paaxel", fontSize: 14 }}>
              {g.name || "Group"}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Week Navigator ──────────────────────────────────────────
function WeekNavigator({
  weekOf,
  onPrev,
  onNext,
}: {
  weekOf: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.md,
        backgroundColor: CARD,
        borderRadius: Radii.md,
        borderColor: BORDER,
        borderWidth: 1,
        padding: Spacing.sm,
      }}
    >
      <Pressable onPress={onPrev} style={{ padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: TEXT, fontSize: 20, fontFamily: "Paaxel" }}>&lt;</Text>
      </Pressable>
      <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 15 }}>
        {formatWeekRange(weekOf)}
      </Text>
      <Pressable onPress={onNext} style={{ padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: TEXT, fontSize: 20, fontFamily: "Paaxel" }}>&gt;</Text>
      </Pressable>
    </View>
  );
}

// ─── Prompt Row ──────────────────────────────────────────────
function AdminPromptRow({
  gp,
  memberCount,
  onPress,
  onDeactivate,
}: {
  gp: AdminGroupPrompt;
  memberCount: number;
  onPress: () => void;
  onDeactivate: () => void;
}) {
  const status = promptStatus(gp);
  const type = gp.prompt?.type || "?";
  const content = gp.prompt?.content || "(no content)";

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: CARD,
        borderColor: status === "deactivated" ? DANGER : BORDER,
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        opacity: status === "deactivated" ? 0.5 : 1,
      }}
    >
      {/* Top row: day + type badge + status dot */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 12, width: 90 }}>
          {formatDay(gp.scheduled_for)}
        </Text>
        <View
          style={{
            backgroundColor: type === "quiplash" ? TYPE_COLORS.quiplash_vote : (TYPE_COLORS[type] || MUTED),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Paaxel", fontSize: 11 }}>
            {type === "quiplash" ? "Quiplash" : typeLabel(type)}
          </Text>
        </View>
        {/* For non-quiplash, show status dot inline (quiplash shows per-phase below) */}
        {type !== "quiplash" && (
          <>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: STATUS_COLORS[status],
                marginRight: 6,
              }}
            />
            <Text style={{ color: MUTED, fontSize: 11 }}>{status}</Text>
          </>
        )}

        {/* Spacer + deactivate button */}
        <View style={{ flex: 1 }} />
        {gp.is_active && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDeactivate();
            }}
            hitSlop={8}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: "rgba(255,68,68,0.15)",
              minWidth: 44,
              minHeight: 32,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: DANGER, fontFamily: "Paaxel", fontSize: 11 }}>Remove</Text>
          </Pressable>
        )}
      </View>

      {/* Content preview */}
      <Text style={{ color: TEXT, fontSize: 14, marginBottom: 4 }} numberOfLines={2}>
        {content}
      </Text>

      {/* Response count — quiplash shows answers + votes as separate phases */}
      {type === "quiplash" ? (
        <View style={{ gap: 3 }}>
          {/* Phase 1: Prompt answers (2 players per prompt) */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: (gp.quiplash_answered || 0) >= 2 ? SUCCESS : MUTED,
            }} />
            <Text style={{ color: TYPE_COLORS.quiplash, fontSize: 12, fontFamily: "Paaxel" }}>
              Answers: {gp.quiplash_answered || 0}/2
            </Text>
            {(gp.quiplash_answered || 0) >= 2 && (
              <Text style={{ color: SUCCESS, fontSize: 11, fontFamily: "Paaxel" }}>done</Text>
            )}
          </View>
          {/* Phase 2: Voting (everyone except the 2 who answered) */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: STATUS_COLORS[status],
            }} />
            <Text style={{ color: TYPE_COLORS.quiplash_vote, fontSize: 12, fontFamily: "Paaxel" }}>
              Votes: {gp.quiplash_vote_count || 0}/{Math.max(0, memberCount - 2)}
            </Text>
            <Text style={{ color: MUTED, fontSize: 11 }}>{status}</Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: MUTED, fontSize: 12 }}>
          {gp.response_count}/{memberCount} responded
        </Text>
      )}
    </Pressable>
  );
}

// ─── Response Detail Modal ───────────────────────────────────
function ResponseDetailModal({
  visible,
  groupPromptId,
  promptType,
  promptContent,
  onClose,
}: {
  visible: boolean;
  groupPromptId: string | undefined;
  promptType?: string;
  promptContent?: string;
  onClose: () => void;
}) {
  const { data: responses, isLoading } = usePromptResponses(
    visible ? groupPromptId : undefined,
    promptType
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 12,
          }}
        >
          <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 18, flex: 1 }} numberOfLines={1}>
            Responses
          </Text>
          <Pressable
            onPress={onClose}
            style={{ padding: 8, backgroundColor: CARD, borderRadius: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 16 }}>X</Text>
          </Pressable>
        </View>

        {/* Prompt content */}
        {promptContent && (
          <Text style={{ color: MUTED, fontSize: 13, paddingHorizontal: 20, marginBottom: 12 }}>
            {promptContent}
          </Text>
        )}

        {/* Responses list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {isLoading && (
            <ActivityIndicator color={BTN} style={{ marginTop: 20 }} />
          )}
          {!isLoading && (!responses || responses.length === 0) && (
            <Text style={{ color: MUTED, textAlign: "center", marginTop: 20 }}>
              No responses yet
            </Text>
          )}
          {responses?.map((r) => (
            <ResponseRow key={r.id} response={r} promptType={promptType} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ResponseRow({
  response,
  promptType,
}: {
  response: AdminResponse;
  promptType?: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Resolve signed URL for photos
  React.useEffect(() => {
    if (response.media_url) {
      getSignedImageUrl(response.media_url).then(setImageUrl);
    }
  }, [response.media_url]);

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: CARD,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: Spacing.sm,
        marginBottom: 8,
        alignItems: "flex-start",
      }}
    >
      {/* Mini avatar */}
      <View style={{ width: 32, height: 40, marginRight: 10, overflow: "hidden" }}>
        <View style={{ transform: [{ translateX: -24 }, { scale: 0.5 }] }}>
          <PixelCharacter config={response.avatar_config || DEFAULT_CHARACTER} size={50} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 13, marginBottom: 2 }}>
          {response.username}
        </Text>

        {/* Text response */}
        {response.content && (
          <Text style={{ color: MUTED, fontSize: 13 }}>{response.content}</Text>
        )}

        {/* MC/Quiz selected option */}
        {response.selected_option && !response.content && (
          <Text style={{ color: MUTED, fontSize: 13 }}>Selected: {response.selected_option}</Text>
        )}

        {/* Photo */}
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 120, height: 120, borderRadius: 8, marginTop: 4 }}
            resizeMode="cover"
          />
        )}

        {/* No answer (quiplash) */}
        {promptType === "quiplash" && !response.content && (
          <Text style={{ color: MUTED, fontSize: 12, fontStyle: "italic" }}>(no answer)</Text>
        )}
      </View>
    </View>
  );
}

// ─── Feedback Section ────────────────────────────────────────
interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  created_at: string;
  group_id: string | null;
  week_of: string | null;
}

interface CustomPromptItem {
  id: string;
  content: string;
  title: string | null;
  type: string;
  created_at: string;
  created_by_username: string | null;
}

function FeedbackSection() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch feedback
        const { data: fb } = await supabase
          .from('app_feedback')
          .select('id, content, source, created_at, group_id, week_of')
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch user-generated prompts
        const { data: prompts } = await supabase
          .from('prompts')
          .select('id, content, title, type, created_at, created_by')
          .eq('is_user_generated', true)
          .order('created_at', { ascending: false })
          .limit(50);

        // Get usernames for custom prompts
        let promptItems: CustomPromptItem[] = [];
        if (prompts && prompts.length > 0) {
          const userIds = [...new Set(prompts.map((p: any) => p.created_by).filter(Boolean))];
          const { data: profiles } = userIds.length > 0
            ? await supabase.from('profiles').select('id, username').in('id', userIds)
            : { data: [] };
          const usernameMap = new Map((profiles || []).map((p: any) => [p.id, p.username]));
          promptItems = prompts.map((p: any) => ({
            id: p.id,
            content: p.content || p.title || '(no content)',
            title: p.title,
            type: p.type,
            created_at: p.created_at,
            created_by_username: usernameMap.get(p.created_by) || null,
          }));
        }

        setFeedback(fb || []);
        setCustomPrompts(promptItems);
      } catch (e) {
        console.error('Error loading feedback:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <View
      style={{
        backgroundColor: CARD,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginTop: Spacing.lg,
      }}
    >
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 16 }}>
          Feedback
        </Text>
        <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 14 }}>
          {expanded ? "▲" : "▼"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: Spacing.md }}>
          {loading && <ActivityIndicator color={BTN} style={{ marginVertical: 12 }} />}

          {!loading && feedback.length === 0 && customPrompts.length === 0 && (
            <Text style={{ color: MUTED, fontSize: 13, textAlign: "center" }}>No feedback yet</Text>
          )}

          {/* Anonymous Feedback */}
          {feedback.length > 0 && (
            <>
              <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 13, marginBottom: 8 }}>
                Anonymous Feedback ({feedback.length})
              </Text>
              {feedback.map((fb) => (
                <View
                  key={fb.id}
                  style={{
                    backgroundColor: BG,
                    borderColor: BORDER,
                    borderWidth: 1,
                    borderRadius: Radii.sm,
                    padding: Spacing.sm,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 14, marginBottom: 4 }}>{fb.content}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Text style={{ color: MUTED, fontSize: 11 }}>{formatDate(fb.created_at)}</Text>
                    <Text style={{ color: TYPE_COLORS.short_text, fontSize: 11 }}>{fb.source}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Custom Prompt Submittals */}
          {customPrompts.length > 0 && (
            <>
              <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 13, marginBottom: 8, marginTop: feedback.length > 0 ? 12 : 0 }}>
                Custom Prompts ({customPrompts.length})
              </Text>
              {customPrompts.map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: BG,
                    borderColor: BORDER,
                    borderWidth: 1,
                    borderRadius: Radii.sm,
                    padding: Spacing.sm,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 14, marginBottom: 4 }}>{p.content}</Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <Text style={{ color: MUTED, fontSize: 11 }}>{formatDate(p.created_at)}</Text>
                    <Text style={{ color: TYPE_COLORS[p.type] || MUTED, fontSize: 11 }}>{typeLabel(p.type)}</Text>
                    {p.created_by_username && (
                      <Text style={{ color: SUCCESS, fontSize: 11 }}>by {p.created_by_username}</Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── AI Operations Section ───────────────────────────────────
function AIOperationsSection({
  schedule,
  groupId,
  weekOf,
}: {
  schedule: AdminGroupPrompt[];
  groupId: string | undefined;
  weekOf: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [pcState, setPcState] = useState<any>(null);
  const [tribunalCache, setTribunalCache] = useState<Record<string, boolean>>({});

  // Load photo completion game state for this week
  useEffect(() => {
    if (!groupId) return;
    supabase
      .from("photo_completion_game_state")
      .select("id, phase, cutoff_group_prompt_id, completion_group_prompt_id")
      .eq("group_id", groupId)
      .eq("week_of", weekOf)
      .maybeSingle()
      .then(({ data }) => setPcState(data));
  }, [groupId, weekOf]);

  // Check DB for dynamically generated tribunal results
  useEffect(() => {
    const tribunalGpIds = schedule
      .filter((gp) => gp.prompt?.payload?.is_tribunal && !JUDGE_CONFIGS[gp.id])
      .map((gp) => gp.id);
    if (tribunalGpIds.length === 0) return;
    supabase
      .from("tribunal_judge_results")
      .select("group_prompt_id")
      .in("group_prompt_id", tribunalGpIds)
      .then(({ data }) => {
        const cache: Record<string, boolean> = {};
        for (const row of data || []) cache[row.group_prompt_id] = true;
        setTribunalCache(cache);
      });
  }, [schedule]);

  // Detect AI-relevant prompts from the schedule
  const aiJudgePrompts = schedule.filter(
    (gp) => gp.prompt?.payload?.is_tribunal === true
  );
  const blindRankingPrompts = schedule.filter(
    (gp) => gp.prompt?.payload?.is_blind_ranking === true
  );
  const stepsPrompts = schedule.filter(
    (gp) => gp.prompt?.payload?.is_steps === true
  );
  const hasPhotoCompletion = pcState !== null;

  const totalOps =
    aiJudgePrompts.length +
    blindRankingPrompts.length +
    stepsPrompts.length +
    (hasPhotoCompletion ? 1 : 0) +
    1; // +1 for Fireside

  return (
    <View
      style={{
        backgroundColor: CARD,
        borderColor: "#FFD700",
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: Spacing.md,
        marginTop: Spacing.lg,
      }}
    >
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: "#FFD700", fontFamily: "Paaxel", fontSize: 16 }}>
            AI Operations
          </Text>
          <View
            style={{
              backgroundColor: "#FFD700" + "25",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFD700", fontSize: 11, fontWeight: "700" }}>
              {totalOps}
            </Text>
          </View>
        </View>
        <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 14 }}>
          {expanded ? "\u25B2" : "\u25BC"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: Spacing.md, gap: 8 }}>
          {/* AI Judge prompts (Tribunal) — simple preview row */}
          {aiJudgePrompts.map((gp) => {
            const st = promptStatus(gp);
            const hasData = !!JUDGE_CONFIGS[gp.id] || tribunalCache[gp.id];
            const opSt: AIOpStatus = hasData
              ? "done"
              : st === "expired" && gp.response_count >= 2
              ? "ready"
              : st === "active"
              ? "waiting"
              : st === "upcoming"
              ? "scheduled"
              : "idle";
            return (
              <AIOpRow
                key={gp.id}
                icon="Tribunal"
                label={`AI Judge — ${gp.prompt?.title || "prompt"}`}
                detail={`${gp.response_count} responses | ${st}`}
                status={opSt}
                actionLabel={hasData ? "Preview" : undefined}
                onAction={
                  hasData
                    ? () => router.push({ pathname: "/judge-test", params: { gpId: gp.id } })
                    : undefined
                }
              />
            );
          })}

          {/* Blind Ranking (AI processes results for Fireside visualization) */}
          {blindRankingPrompts.map((gp) => {
            const status = promptStatus(gp);
            return (
              <AIOpRow
                key={gp.id}
                icon="Scale"
                label={`Blind Ranking — ${gp.prompt?.title || "prompt"}`}
                detail={`${gp.response_count} responses | ${status}`}
                status={status === "expired" ? "ready" : status === "active" ? "waiting" : "scheduled"}
              />
            );
          })}

          {/* Steps Challenge */}
          {stepsPrompts.map((gp) => {
            const status = promptStatus(gp);
            return (
              <AIOpRow
                key={gp.id}
                icon="Steps"
                label={`Steps Race — ${gp.prompt?.title || "prompt"}`}
                detail={`${gp.response_count} responses | ${status}`}
                status={status === "expired" ? "ready" : status === "active" ? "waiting" : "scheduled"}
              />
            );
          })}

          {/* Photo Completion AI Merge + Preview */}
          {hasPhotoCompletion && (
            <PhotoCompletionPreview
              groupId={groupId!}
              weekOf={weekOf}
              phase={pcState?.phase || "?"}
            />
          )}

          {/* Fireside Preview */}
          <AIOpRow
            icon="Fire"
            label="Fireside Preview"
            detail="Weekly review compilation"
            status="scheduled"
            actionLabel="Preview"
            onAction={
              groupId
                ? () =>
                    router.push({
                      pathname: "/group/[id]/lowdown",
                      params: { id: groupId },
                    })
                : undefined
            }
          />

          {/* AI Judge Test */}
          <AIOpRow
            icon="Test"
            label="AI Judge Test Page"
            detail="Mock data testing"
            status="idle"
            actionLabel="Open"
            onAction={
              groupId
                ? () =>
                    router.push({
                      pathname: "/judge-test",
                      params: { groupId },
                    })
                : undefined
            }
          />
        </View>
      )}
    </View>
  );
}

// ─── Photo Completion Preview ───────────────────────────────
function PhotoCompletionPreview({
  groupId,
  weekOf,
  phase,
}: {
  groupId: string;
  weekOf: string;
  phase: string;
}) {
  const [pairs, setPairs] = useState<PhotoCompletionPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState<Record<string, boolean>>({});
  const [mergeResults, setMergeResults] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPairs();
  }, [groupId, weekOf]);

  const loadPairs = async () => {
    setLoading(true);
    const results = await getPhotoCompletionResults(groupId, weekOf);
    const p = results?.pairs || [];
    setPairs(p);
    setLoading(false);

    // Resolve signed URLs for all photos
    const urls: Record<string, string> = {};
    for (const pair of p) {
      if (pair.original_photo_url) {
        const signed = await getSignedImageUrl(pair.original_photo_url);
        if (signed) urls[pair.original_photo_url] = signed;
      }
      if (pair.completion_photo_url) {
        const signed = await getSignedImageUrl(pair.completion_photo_url);
        if (signed) urls[pair.completion_photo_url] = signed;
      }
      if (pair.merged_photo_url) {
        const signed = await getSignedImageUrl(pair.merged_photo_url);
        if (signed) urls[pair.merged_photo_url] = signed;
      }
    }
    setSignedUrls(urls);
  };

  const handleMerge = async (pair: PhotoCompletionPair) => {
    if (!pair.original_photo_url || !pair.completion_photo_url) {
      Alert.alert("Missing Photos", "Both cutoff and completion photos are required.");
      return;
    }

    setMerging((prev) => ({ ...prev, [pair.assignment_id]: true }));
    try {
      const resp = await supabase.functions.invoke("merge-photos", {
        body: {
          assignment_id: pair.assignment_id,
          original_photo_path: pair.original_photo_url,
          completion_photo_path: pair.completion_photo_url,
        },
      });

      if (resp.error) {
        Alert.alert("Merge Failed", resp.error.message || "Unknown error");
      } else if (resp.data?.success) {
        setMergeResults((prev) => ({ ...prev, [pair.assignment_id]: resp.data.merged_url }));
        // Refresh signed URL for merged photo
        if (resp.data.merged_url) {
          const signed = await getSignedImageUrl(resp.data.merged_url);
          if (signed) setSignedUrls((prev) => ({ ...prev, [resp.data.merged_url]: signed }));
        }
        Alert.alert("Merged!", resp.data.description || "Photo merged successfully");
      } else {
        Alert.alert("Merge Failed", resp.data?.error || "Unknown error");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to call merge function");
    } finally {
      setMerging((prev) => ({ ...prev, [pair.assignment_id]: false }));
    }
  };

  const status: AIOpStatus =
    phase === "complete" ? "done" : phase === "submit_completion" ? "waiting" : "scheduled";
  const completePairs = pairs.filter(
    (p) => p.original_photo_url && p.completion_photo_url
  );

  return (
    <View
      style={{
        backgroundColor: BG,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: Spacing.sm,
      }}
    >
      {/* Header row */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 18 }}>{"\uD83E\uDDE9"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: TEXT, fontSize: 13, fontFamily: "Paaxel" }}>
            AI Photo Merge
          </Text>
          <Text style={{ color: MUTED, fontSize: 11 }}>
            Phase: {phase} | {completePairs.length}/{pairs.length} pairs ready
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: AI_STATUS_COLORS[status],
              }}
            />
            <Text
              style={{
                color: AI_STATUS_COLORS[status],
                fontSize: 10,
                fontFamily: "Paaxel",
              }}
            >
              {AI_STATUS_LABELS[status]}
            </Text>
          </View>
        </View>
        <Text style={{ color: MUTED, fontSize: 14 }}>
          {expanded ? "\u25B2" : "\u25BC"}
        </Text>
      </Pressable>

      {/* Expanded pairs view */}
      {expanded && (
        <View style={{ marginTop: 12, gap: 12 }}>
          {loading && <ActivityIndicator color={BTN} />}
          {!loading && pairs.length === 0 && (
            <Text style={{ color: MUTED, fontSize: 12, textAlign: "center" }}>
              No pairs found
            </Text>
          )}
          {pairs.map((pair) => {
            const origUrl = pair.original_photo_url
              ? signedUrls[pair.original_photo_url]
              : null;
            const compUrl = pair.completion_photo_url
              ? signedUrls[pair.completion_photo_url]
              : null;
            const mergedKey =
              mergeResults[pair.assignment_id] || pair.merged_photo_url;
            const mergedUrl = mergedKey ? signedUrls[mergedKey] : null;
            const isMerging = merging[pair.assignment_id] || false;
            const canMerge =
              !!pair.original_photo_url && !!pair.completion_photo_url && !isMerging;

            return (
              <View
                key={pair.assignment_id}
                style={{
                  backgroundColor: CARD,
                  borderColor: BORDER,
                  borderWidth: 1,
                  borderRadius: Radii.sm,
                  padding: Spacing.sm,
                }}
              >
                {/* Names */}
                <Text style={{ color: TEXT, fontSize: 12, fontFamily: "Paaxel", marginBottom: 6 }}>
                  {pair.original_username} {"\u2192"} {pair.completer_username}
                </Text>

                {/* Photos side by side */}
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                  {/* Cutoff photo */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: MUTED, fontSize: 9, marginBottom: 2 }}>Cutoff</Text>
                    {origUrl ? (
                      <Image
                        source={{ uri: origUrl }}
                        style={{ width: "100%", height: 100, borderRadius: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 100,
                          borderRadius: 6,
                          backgroundColor: BG,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: MUTED, fontSize: 10 }}>Waiting...</Text>
                      </View>
                    )}
                  </View>

                  {/* Completion photo */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: MUTED, fontSize: 9, marginBottom: 2 }}>Completion</Text>
                    {compUrl ? (
                      <Image
                        source={{ uri: compUrl }}
                        style={{ width: "100%", height: 100, borderRadius: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 100,
                          borderRadius: 6,
                          backgroundColor: BG,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: MUTED, fontSize: 10 }}>Waiting...</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Merged photo (full width) */}
                {mergedUrl && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: "#FFD700", fontSize: 10, fontFamily: "Paaxel", marginBottom: 2 }}>
                      AI Merged
                    </Text>
                    <Image
                      source={{ uri: mergedUrl }}
                      style={{ width: "100%", height: 140, borderRadius: 6 }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Merge button */}
                {canMerge && !mergedUrl && (
                  <Pressable
                    onPress={() => handleMerge(pair)}
                    style={{
                      backgroundColor: "#FFD700" + "20",
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFD700", fontSize: 12, fontFamily: "Paaxel" }}>
                      {"\u2728"} Generate AI Merge
                    </Text>
                  </Pressable>
                )}
                {isMerging && (
                  <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color="#FFD700" />
                    <Text style={{ color: "#FFD700", fontSize: 11 }}>Merging...</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Merge All button */}
          {completePairs.length > 1 && (
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Merge All Pairs",
                  `Generate AI merge for ${completePairs.length} pairs?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Merge All",
                      onPress: () => {
                        for (const pair of completePairs) {
                          if (!pair.merged_photo_url && !mergeResults[pair.assignment_id]) {
                            handleMerge(pair);
                          }
                        }
                      },
                    },
                  ]
                );
              }}
              style={{
                backgroundColor: "#FFD700" + "30",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFD700", fontSize: 13, fontFamily: "Paaxel" }}>
                {"\u2728"} Merge All ({completePairs.filter((p) => !p.merged_photo_url && !mergeResults[p.assignment_id]).length} remaining)
              </Text>
            </Pressable>
          )}

          {/* Refresh button */}
          <Pressable
            onPress={loadPairs}
            style={{
              paddingVertical: 6,
              alignItems: "center",
            }}
          >
            <Text style={{ color: MUTED, fontSize: 11, fontFamily: "Paaxel" }}>
              {"\u21BB"} Refresh
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type AIOpStatus = "scheduled" | "waiting" | "ready" | "done" | "idle";

const AI_STATUS_COLORS: Record<AIOpStatus, string> = {
  scheduled: "#4A9EFF",
  waiting: "#FFA033",
  ready: SUCCESS,
  done: SUCCESS,
  idle: MUTED,
};

const AI_STATUS_LABELS: Record<AIOpStatus, string> = {
  scheduled: "Scheduled",
  waiting: "Collecting...",
  ready: "Ready",
  done: "Complete",
  idle: "Idle",
};

function AIOpRow({
  icon,
  label,
  detail,
  status,
  actionLabel,
  onAction,
}: {
  icon: string;
  label: string;
  detail: string;
  status: AIOpStatus;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const iconMap: Record<string, string> = {
    Tribunal: "\u2696\uFE0F",
    Scale: "\u2696\uFE0F",
    Steps: "\uD83D\uDC5F",
    Merge: "\uD83E\uDDE9",
    Fire: "\uD83D\uDD25",
    Test: "\uD83E\uDDEA",
  };

  return (
    <View
      style={{
        backgroundColor: BG,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: Spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 18 }}>{iconMap[icon] || "\u2728"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT, fontSize: 13, fontFamily: "Paaxel" }}>{label}</Text>
        <Text style={{ color: MUTED, fontSize: 11 }}>{detail}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: AI_STATUS_COLORS[status],
            }}
          />
          <Text style={{ color: AI_STATUS_COLORS[status], fontSize: 10, fontFamily: "Paaxel" }}>
            {AI_STATUS_LABELS[status]}
          </Text>
        </View>
        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 4,
              backgroundColor: "#FFD700" + "20",
            }}
          >
            <Text style={{ color: "#FFD700", fontSize: 10, fontFamily: "Paaxel" }}>
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main Admin Screen ───────────────────────────────────────
export default function AdminScreen() {
  const { data: groups, isLoading: groupsLoading } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [weekOf, setWeekOf] = useState(() => getWeekOf());

  // Response detail modal state
  const [detailPrompt, setDetailPrompt] = useState<{
    id: string;
    type?: string;
    content?: string;
  } | null>(null);

  // Auto-select first group
  const activeGroupId = selectedGroupId || groups?.[0]?.id;

  const { data: schedule, isLoading: scheduleLoading, refetch } = useWeekSchedule(activeGroupId, weekOf);
  const { data: memberCount } = useGroupMemberCount(activeGroupId);
  const deactivateMutation = useDeactivatePrompt();

  const handlePrevWeek = () => {
    const d = new Date(weekOf + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setWeekOf(d.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(weekOf + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setWeekOf(d.toISOString().split("T")[0]);
  };

  const handleDeactivate = (gp: AdminGroupPrompt) => {
    Alert.alert(
      "Remove Prompt",
      `Deactivate "${gp.prompt?.content?.substring(0, 60)}..."?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deactivateMutation.mutate(gp.id, {
              onSuccess: (result) => {
                if (result.success) {
                  refetch();
                } else {
                  Alert.alert("Error", result.error || "Failed to deactivate");
                }
              },
              onError: (err: any) => {
                Alert.alert("Error", err?.message || "Failed to deactivate");
              },
            });
          },
        },
      ]
    );
  };

  // Group prompts by day for visual clarity
  const groupedByDay = useMemo(() => {
    if (!schedule) return [];
    const days: { day: string; prompts: AdminGroupPrompt[] }[] = [];
    let currentDay = "";
    for (const gp of schedule) {
      const day = formatDay(gp.scheduled_for);
      if (day !== currentDay) {
        days.push({ day, prompts: [gp] });
        currentDay = day;
      } else {
        days[days.length - 1].prompts.push(gp);
      }
    }
    return days;
  }, [schedule]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <NightSky density="minimal" showMoon showShootingStars={false} showFireflies={false} showGradient={false} moonBgColor={BG} />

      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg, marginTop: 30 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 8, minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: TEXT, fontSize: 22, fontFamily: "Paaxel" }}>&lt;</Text>
          </Pressable>
          <PixelTitle fontSize={24}>Admin</PixelTitle>
        </View>

        {/* Group Picker */}
        {groupsLoading ? (
          <ActivityIndicator color={BTN} style={{ marginBottom: 16 }} />
        ) : (
          <GroupPicker
            groups={groups || []}
            selected={activeGroupId}
            onSelect={setSelectedGroupId}
          />
        )}

        {/* Week Navigator */}
        <WeekNavigator weekOf={weekOf} onPrev={handlePrevWeek} onNext={handleNextWeek} />

        {/* Schedule */}
        {scheduleLoading ? (
          <ActivityIndicator color={BTN} style={{ marginTop: 30 }} />
        ) : !schedule || schedule.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: MUTED, fontFamily: "Paaxel", fontSize: 15 }}>
              No prompts this week
            </Text>
          </View>
        ) : (
          groupedByDay.map((dayGroup) => (
            <View key={dayGroup.day}>
              {dayGroup.prompts.map((gp) => (
                <AdminPromptRow
                  key={gp.id}
                  gp={gp}
                  memberCount={memberCount || 0}
                  onPress={() =>
                    setDetailPrompt({
                      id: gp.id,
                      type: gp.prompt?.type,
                      content: gp.prompt?.content,
                    })
                  }
                  onDeactivate={() => handleDeactivate(gp)}
                />
              ))}
            </View>
          ))
        )}

        {/* Summary stats */}
        {schedule && schedule.length > 0 && (
          <View
            style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: Radii.md,
              padding: Spacing.md,
              marginTop: Spacing.md,
            }}
          >
            <Text style={{ color: TEXT, fontFamily: "Paaxel", fontSize: 14, marginBottom: 4 }}>
              Week Summary
            </Text>
            <Text style={{ color: MUTED, fontSize: 13 }}>
              {schedule.filter((gp) => gp.is_active).length} active prompts  |  {" "}
              {schedule.filter((gp) => !gp.is_active).length} removed
            </Text>
            <Text style={{ color: MUTED, fontSize: 13 }}>
              {memberCount || 0} members  |  {" "}
              {schedule.reduce((sum, gp) => sum + gp.response_count, 0)} total responses
            </Text>
          </View>
        )}

        {/* AI Operations */}
        <AIOperationsSection
          schedule={schedule || []}
          groupId={activeGroupId}
          weekOf={weekOf}
        />

        {/* Feedback & Custom Prompts */}
        <FeedbackSection />
      </ScrollView>

      {/* Response Detail Modal */}
      <ResponseDetailModal
        visible={!!detailPrompt}
        groupPromptId={detailPrompt?.id}
        promptType={detailPrompt?.type}
        promptContent={detailPrompt?.content}
        onClose={() => setDetailPrompt(null)}
      />
    </View>
  );
}
