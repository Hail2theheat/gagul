/**
 * "What is Cool?" Easter Egg Page
 * Shows a -1 point deduction with a joke quote.
 * Triggered from the Tribunal prompt's "What is cool?" button.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CampfireColors } from '@/constants/theme';
import { SPRING_BOUNCY } from '@/constants/animations';
import { supabase } from '@/lib/supabase';
import { emitPointsAwarded } from '@/lib/services/pointsService';

export default function WhatIsCoolScreen() {
  const { groupId, groupPromptId } = useLocalSearchParams<{
    groupId: string;
    groupPromptId: string;
  }>();

  const [deducted, setDeducted] = useState(false);
  const pointScale = useSharedValue(0);
  const pointOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const pointAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointScale.value }],
    opacity: pointOpacity.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    // Deduct 1 point on mount
    const deductPoint = async () => {
      if (deducted) return;
      setDeducted(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Award -1 point (deduction)
        await supabase.rpc('award_points', {
          p_user_id: userData.user.id,
          p_event_type: 'what_is_cool',
          p_points: -1,
          p_group_id: groupId || null,
          p_reference_id: groupPromptId || null,
        });

        // Also update weekly_points if exists
        if (groupId) {
          const weekOf = '2026-02-23'; // This week
          const { data: wp } = await supabase
            .from('weekly_points')
            .select('id, points_answering')
            .eq('group_id', groupId)
            .eq('user_id', userData.user.id)
            .eq('week_of', weekOf)
            .single();

          if (wp) {
            await supabase
              .from('weekly_points')
              .update({ points_answering: Math.max(0, (wp.points_answering || 0) - 1) })
              .eq('id', wp.id);
          }
        }
      } catch (e) {
        console.error('Error deducting point:', e);
      }
    };

    // Trigger animations
    const timer = setTimeout(() => {
      // Heavy haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Shake the screen
      shakeX.value = withSequence(
        withTiming(15, { duration: 50 }),
        withTiming(-15, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );

      // Zoom in the -1 point
      pointScale.value = withSequence(
        withSpring(1.3, SPRING_BOUNCY),
        withDelay(200, withSpring(1, SPRING_BOUNCY)),
      );
      pointOpacity.value = withTiming(1, { duration: 200 });

      deductPoint();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={shakeStyle}>
        {/* Dramatic reveal */}
        <Animated.Text
          entering={FadeInDown.delay(300).springify().damping(12)}
          style={styles.questionText}
        >
          What is cool?
        </Animated.Text>

        {/* -1 point */}
        <Animated.View style={[styles.pointContainer, pointAnimStyle]}>
          <Text style={styles.pointText}>-1</Text>
          <Text style={styles.pointLabel}>point</Text>
        </Animated.View>

        {/* Quote */}
        <Animated.Text
          entering={FadeInUp.delay(1400).springify().damping(14)}
          style={styles.quoteText}
        >
          "Trying to figure out what's cool isn't cool.{'\n'}Be you, bro."
        </Animated.Text>

        {/* Fire emoji decoration */}
        <Animated.Text
          entering={FadeIn.delay(2000)}
          style={styles.fireEmoji}
        >
          {'\u{1F525}'}
        </Animated.Text>
      </Animated.View>

      {/* Back button */}
      <Animated.View entering={FadeIn.delay(2500)}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>I've learned my lesson</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CampfireColors.BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  questionText: {
    fontFamily: 'Paaxel',
    fontSize: 32,
    color: CampfireColors.MUTED,
    textAlign: 'center',
    marginBottom: 40,
  },
  pointContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pointText: {
    fontFamily: 'Paaxel',
    fontSize: 80,
    color: CampfireColors.DANGER,
    textShadowColor: 'rgba(252, 165, 165, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  pointLabel: {
    fontFamily: 'Paaxel',
    fontSize: 24,
    color: CampfireColors.DANGER,
    marginTop: -8,
  },
  quoteText: {
    fontFamily: 'Paaxel',
    fontSize: 18,
    color: CampfireColors.TEXT_CREAM,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  fireEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginTop: 24,
  },
  backButton: {
    backgroundColor: CampfireColors.BTN_PRIMARY + '30',
    borderWidth: 1,
    borderColor: CampfireColors.BTN_PRIMARY + '50',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 48,
  },
  backButtonText: {
    fontFamily: 'Paaxel',
    fontSize: 16,
    color: CampfireColors.TEXT_CREAM,
    textAlign: 'center',
  },
});
