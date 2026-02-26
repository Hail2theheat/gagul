/**
 * judge-test.tsx — Test screen for AI Photo Judge.
 * Picks the right judge data based on gpId (group_prompt) or groupId param.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getSignedImageUrl } from '../lib/services/firesideService';
import AIJudgeReveal from '../components/fireside/AIJudgeReveal';
import { JUDGE_CONFIGS, type JudgeConfig } from '../components/fireside/judgeConfigs';
import type { AIJudgeEntry, NonSubmitter } from '../components/fireside/mockJudgeData';
import { supabase } from '../lib/supabase';
import { CampfireColors } from '../constants/theme';

const WIRTHLIN_GROUP_ID = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';

export default function JudgeTestScreen() {
  const { groupId, gpId } = useLocalSearchParams<{ groupId?: string; gpId?: string }>();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicConfig, setDynamicConfig] = useState<JudgeConfig | null>(null);

  // Resolve config: gpId lookup first (hardcoded), then dynamic DB, then groupId fallback
  const hardcodedConfig = useMemo(() => {
    if (gpId && JUDGE_CONFIGS[gpId]) {
      return JUDGE_CONFIGS[gpId];
    }
    // Legacy fallback: pick by groupId (Wirthlin vs Thugz)
    if (!gpId) {
      const isWirthlin = groupId === WIRTHLIN_GROUP_ID;
      const keys = Object.keys(JUDGE_CONFIGS);
      const wirthlinKey = keys.find(k => JUDGE_CONFIGS[k].title === 'Prettiest Thing You Can Find');
      const thugzKey = keys.find(k => k !== wirthlinKey);
      const fallbackKey = isWirthlin ? wirthlinKey : thugzKey;
      return fallbackKey ? JUDGE_CONFIGS[fallbackKey] : undefined;
    }
    return undefined;
  }, [gpId, groupId]);

  // DB fallback: fetch from tribunal_judge_results if no hardcoded config
  useEffect(() => {
    if (hardcodedConfig || !gpId) return;
    setConfigLoading(true);
    supabase
      .from('tribunal_judge_results')
      .select('result_json')
      .eq('group_prompt_id', gpId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.result_json) {
          setDynamicConfig(data.result_json as JudgeConfig);
        }
        setConfigLoading(false);
      });
  }, [gpId, hardcodedConfig]);

  const config = hardcodedConfig || dynamicConfig;
  const entries: AIJudgeEntry[] = config?.entries ?? [];
  const nonSubmitters: NonSubmitter[] = config?.nonSubmitters ?? [];
  const challengeTitle = config?.title ?? 'AI Judge';

  useEffect(() => {
    if (configLoading) return;

    async function resolveUrls() {
      if (entries.length === 0) {
        setError('No judge data found for this prompt.');
        setLoading(false);
        return;
      }

      try {
        const urlMap: Record<string, string> = {};
        const results = await Promise.all(
          entries.map(async (entry) => {
            const signedUrl = await getSignedImageUrl(entry.photo_path);
            return { userId: entry.user_id, url: signedUrl };
          })
        );

        for (const r of results) {
          if (r.url) {
            urlMap[r.userId] = r.url;
          }
        }

        const resolved = Object.keys(urlMap).length;
        console.log(`[JudgeTest] Resolved ${resolved}/${entries.length} photo URLs`);

        if (resolved === 0) {
          setError('Could not load any photos. Check storage access.');
        }

        setPhotoUrls(urlMap);
      } catch (err: any) {
        console.error('[JudgeTest] Error resolving URLs:', err);
        setError(err?.message || 'Failed to load photos');
      } finally {
        setLoading(false);
      }
    }

    resolveUrls();
  }, [gpId, groupId, configLoading, dynamicConfig]);

  if (loading || configLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFD700" size="large" />
        <Text style={styles.loadingText}>
          {configLoading ? 'Loading judge data...' : 'Loading photos...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.backLink}
          onPress={() => router.back()}
        >
          Go Back
        </Text>
      </View>
    );
  }

  return (
    <AIJudgeReveal
      entries={entries}
      nonSubmitters={nonSubmitters}
      photoUrls={photoUrls}
      challengeTitle={challengeTitle}
      onComplete={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#050A14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: CampfireColors.MUTED,
    fontSize: 14,
    marginTop: 16,
  },
  errorText: {
    color: CampfireColors.DANGER,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backLink: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
});
