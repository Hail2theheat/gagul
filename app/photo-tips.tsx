/**
 * "Photo Advice Tips" Easter Egg Page
 * Shows photography tips and awards +1 point.
 * Triggered from the Artsy Photo prompt's "Photo Advice Tips" button.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CampfireColors } from '@/constants/theme';
import { SPRING_BOUNCY } from '@/constants/animations';
import { supabase } from '@/lib/supabase';
import { emitPointsAwarded } from '@/lib/services/pointsService';

const TIPS = [
  'Get low. Shoot from an unexpected angle.',
  'Use natural light — golden hour is your best friend.',
  'Look for leading lines (roads, fences, shadows).',
  'Fill the frame. Get closer than you think.',
  'Find contrast — light vs dark, color vs neutral.',
  'Use the rule of thirds. Off-center > centered.',
  'Reflections in water or glass = instant art.',
  'Shoot through something (leaves, a window, a fence).',
];

export default function PhotoTipsScreen() {
  const { groupId, groupPromptId } = useLocalSearchParams<{
    groupId: string;
    groupPromptId: string;
  }>();

  const [awarded, setAwarded] = useState(false);
  const pointScale = useSharedValue(0);
  const pointOpacity = useSharedValue(0);

  const pointAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointScale.value }],
    opacity: pointOpacity.value,
  }));

  useEffect(() => {
    const awardPoint = async () => {
      if (awarded) return;
      setAwarded(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        await supabase.rpc('award_points', {
          p_user_id: userData.user.id,
          p_event_type: 'photo_tips',
          p_points: 1,
          p_group_id: groupId || null,
          p_reference_id: groupPromptId || null,
        });
      } catch (e) {
        console.error('Error awarding point:', e);
      }
    };

    const timer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      pointScale.value = withSequence(
        withSpring(1.3, SPRING_BOUNCY),
        withDelay(200, withSpring(1, SPRING_BOUNCY)),
      );
      pointOpacity.value = withTiming(1, { duration: 200 });

      awardPoint();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* +1 point */}
        <Animated.View style={[styles.pointContainer, pointAnimStyle]}>
          <Text style={styles.pointText}>+1</Text>
          <Text style={styles.pointLabel}>point for seeking wisdom</Text>
        </Animated.View>

        {/* Header */}
        <Animated.Text
          entering={FadeInDown.delay(400).springify().damping(14)}
          style={styles.headerText}
        >
          Photo Tips
        </Animated.Text>

        {/* Tips */}
        {TIPS.map((tip, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(700 + i * 150).springify().damping(14)}
            style={styles.tipCard}
          >
            <Text style={styles.tipNumber}>{i + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </Animated.View>
        ))}

        {/* Encouragement */}
        <Animated.Text
          entering={FadeIn.delay(700 + TIPS.length * 150 + 200)}
          style={styles.encouragement}
        >
          Now go make something beautiful.
        </Animated.Text>

        {/* Back button */}
        <Animated.View entering={FadeIn.delay(700 + TIPS.length * 150 + 500)}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.backButtonText}>Back to the prompt</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CampfireColors.BG,
  },
  scrollContent: {
    padding: 32,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
  },
  pointContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointText: {
    fontFamily: 'Paaxel',
    fontSize: 64,
    color: CampfireColors.SUCCESS,
    textShadowColor: 'rgba(74, 222, 128, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  pointLabel: {
    fontFamily: 'Paaxel',
    fontSize: 16,
    color: CampfireColors.SUCCESS,
    marginTop: -4,
  },
  headerText: {
    fontFamily: 'Paaxel',
    fontSize: 28,
    color: CampfireColors.TEXT_CREAM,
    textAlign: 'center',
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(22, 28, 48, 0.88)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CampfireColors.BORDER,
    padding: 16,
    marginBottom: 10,
    width: '100%',
    gap: 12,
  },
  tipNumber: {
    fontFamily: 'Paaxel',
    fontSize: 20,
    color: CampfireColors.FIRE_ORANGE,
    minWidth: 24,
  },
  tipText: {
    fontFamily: 'Paaxel',
    fontSize: 15,
    color: CampfireColors.TEXT,
    flex: 1,
    lineHeight: 22,
  },
  encouragement: {
    fontFamily: 'Paaxel',
    fontSize: 18,
    color: CampfireColors.FIRE_YELLOW,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: CampfireColors.BTN_PRIMARY + '30',
    borderWidth: 1,
    borderColor: CampfireColors.BTN_PRIMARY + '50',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  backButtonText: {
    fontFamily: 'Paaxel',
    fontSize: 16,
    color: CampfireColors.TEXT_CREAM,
    textAlign: 'center',
  },
});
