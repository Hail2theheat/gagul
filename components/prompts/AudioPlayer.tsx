/**
 * AudioPlayer - Play back voice recordings
 * Used in Fireside to play voice responses
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0B1026',
  card: 'rgba(20, 30, 50, 0.85)',
  border: '#2a3f5f',
  text: '#FFF8DC',
  muted: '#B8A88A',
  accent: '#FF6B35',
};

interface AudioPlayerProps {
  uri: string;
  duration?: number; // Duration in ms if known
  compact?: boolean;
}

export function AudioPlayer({ uri, duration: knownDuration, compact = false }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(knownDuration || 0);
  const [isLoading, setIsLoading] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (duration > 0) {
      Animated.timing(progressAnim, {
        toValue: position / duration,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [position, duration]);

  const loadAndPlay = async () => {
    setIsLoading(true);

    try {
      if (sound) {
        // Already loaded, just play
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load and play
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );

        setSound(newSound);
        setIsPlaying(true);

        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis);
        }
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    }

    setIsLoading(false);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setPosition(0);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayback = async () => {
    if (!sound) {
      await loadAndPlay();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.positionMillis === status.durationMillis) {
        // At end, restart
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        <View style={styles.compactButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={16}
            color={COLORS.text}
          />
        </View>
        <View style={styles.compactWaveform}>
          {[...Array(12)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 8 + Math.sin(i * 0.8) * 8,
                  opacity: progressAnim.interpolate({
                    inputRange: [0, i / 12, 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.compactTime}>
          {formatTime(isPlaying ? position : duration)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Play button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        <Ionicons
          name={isLoading ? 'hourglass' : isPlaying ? 'pause' : 'play'}
          size={28}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {/* Progress area */}
      <View style={styles.progressArea}>
        {/* Waveform visualization */}
        <View style={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 12 + Math.sin(i * 0.6) * 12 + Math.random() * 4,
                  opacity: progressAnim.interpolate({
                    inputRange: [0, i / 20, 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressArea: {
    flex: 1,
    gap: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: COLORS.muted,
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  compactButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
  },
  compactTime: {
    color: COLORS.muted,
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 32,
  },
});
