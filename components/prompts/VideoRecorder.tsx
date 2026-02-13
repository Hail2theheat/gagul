/**
 * VideoRecorder - Record video responses for prompts
 * Uses expo-camera for video recording with preview after recording
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Camera preview should be roughly 4:3 aspect ratio, sized for the card
const CAMERA_HEIGHT = Math.min(SCREEN_HEIGHT * 0.45, 400);

const COLORS = {
  bg: '#0B1026',
  card: 'rgba(20, 30, 50, 0.85)',
  border: '#2a3f5f',
  text: '#FFF8DC',
  muted: '#B8A88A',
  accent: '#FF6B35',
  red: '#EF4444',
  success: '#4ADE80',
};

const MAX_DURATION = 30000; // 30 seconds max


interface VideoRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  maxDuration?: number;
}

export function VideoRecorder({
  onRecordingComplete,
  maxDuration = MAX_DURATION,
}: VideoRecorderProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [finalDuration, setFinalDuration] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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

  const requestPermissions = async () => {
    const camera = await requestCameraPermission();
    const mic = await requestMicPermission();

    if (!camera.granted || !mic.granted) {
      Alert.alert(
        'Permissions Required',
        'Please enable camera and microphone access in your device settings to record videos.'
      );
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (!cameraPermission?.granted || !micPermission?.granted) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    if (!cameraRef.current) return;

    try {
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

      const video = await cameraRef.current.recordAsync({
        maxDuration: maxDuration / 1000,
      });

      if (video?.uri) {
        // Store video for preview instead of immediately submitting
        setRecordedUri(video.uri);
        setFinalDuration(recordingDuration);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const handleUseVideo = () => {
    if (recordedUri) {
      onRecordingComplete(recordedUri, finalDuration);
    }
  };

  const handleReRecord = () => {
    setRecordedUri(null);
    setFinalDuration(0);
    setRecordingDuration(0);
  };

  const stopRecording = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }

    setIsRecording(false);
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = recordingDuration / maxDuration;

  // Check permissions
  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="videocam-off" size={48} color={COLORS.muted} />
        <Text style={styles.permissionText}>
          Camera and microphone access required
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show preview if we have a recorded video
  if (recordedUri) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <Video
            style={styles.camera}
            source={{ uri: recordedUri }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={true}
          />

          {/* Duration badge */}
          <View style={styles.previewBadge}>
            <Ionicons name="videocam" size={14} color={COLORS.text} />
            <Text style={styles.previewDuration}>
              {formatDuration(finalDuration)}
            </Text>
          </View>
        </View>

        {/* Preview controls */}
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.reRecordButton}
            onPress={handleReRecord}
          >
            <Ionicons name="refresh" size={20} color={COLORS.text} />
            <Text style={styles.reRecordText}>Re-record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.useVideoButton}
            onPress={handleUseVideo}
          >
            <Ionicons name="checkmark" size={20} color={COLORS.text} />
            <Text style={styles.useVideoText}>Use This Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
        >
          {/* Recording indicator */}
          {isRecording && (
            <View style={styles.recordingOverlay}>
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </View>
          )}

          {/* Flip camera button */}
          {!isRecording && (
            <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
              <Ionicons name="camera-reverse" size={28} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </CameraView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.recordIcon} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>
          {isRecording
            ? 'Tap to stop recording'
            : `Tap to record (max ${Math.floor(maxDuration / 1000)}s)`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  permissionContainer: {
    height: CAMERA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  permissionText: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    height: CAMERA_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginVertical: 8,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  recordingTime: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.red,
  },
  flipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    borderWidth: 4,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    borderColor: COLORS.red,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.red,
  },
  stopIcon: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.red,
    borderRadius: 4,
  },
  hint: {
    color: COLORS.muted,
    fontSize: 14,
  },
  previewBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  previewDuration: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  previewControls: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 0,
    gap: 12,
  },
  reRecordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reRecordText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  useVideoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  useVideoText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
