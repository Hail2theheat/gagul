/**
 * VoiceRecorder - Record voice responses for prompts
 * Uses expo-av for audio recording
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0B1026',
  card: 'rgba(20, 30, 50, 0.85)',
  border: '#2a3f5f',
  text: '#FFF8DC',
  muted: '#B8A88A',
  accent: '#FF6B35',
  red: '#EF4444',
  green: '#4ADE80',
};

const MAX_DURATION = 60000; // 60 seconds max

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  maxDuration?: number;
}

export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = MAX_DURATION,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const checkPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Microphone Access',
        'Please enable microphone access in your device settings to record voice responses.'
      );
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      checkPermissions();
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1000;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        onRecordingComplete(uri, recordingDuration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }

    setRecording(null);
  };

  const cancelRecording = async () => {
    if (!recording) return;

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);

    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }

    setRecording(null);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const remainingTime = maxDuration - recordingDuration;
  const progress = recordingDuration / maxDuration;

  return (
    <View style={styles.container}>
      {/* Progress ring */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg} />
        <View
          style={[
            styles.progressFill,
            {
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />

        {/* Record button */}
        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!permissionGranted}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <Ionicons name="mic" size={40} color={COLORS.text} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Duration display */}
      <View style={styles.durationContainer}>
        {isRecording ? (
          <>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </View>
            <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
            <Text style={styles.remaining}>
              {formatDuration(remainingTime)} remaining
            </Text>
          </>
        ) : (
          <Text style={styles.instructions}>
            Tap to start recording (max {Math.floor(maxDuration / 1000)}s)
          </Text>
        )}
      </View>

      {/* Cancel button */}
      {isRecording && (
        <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
          <Ionicons name="close-circle" size={24} color={COLORS.muted} />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  progressContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: COLORS.border,
  },
  progressFill: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: COLORS.accent,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  buttonWrapper: {
    width: 100,
    height: 100,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: COLORS.red + '30',
    borderColor: COLORS.red,
  },
  stopIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.red,
    borderRadius: 4,
  },
  durationContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  recordingText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    fontVariantNumeric: 'tabular-nums',
  },
  remaining: {
    color: COLORS.muted,
    fontSize: 14,
  },
  instructions: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});
