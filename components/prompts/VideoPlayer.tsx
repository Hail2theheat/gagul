/**
 * VideoPlayer - Play back video recordings
 * Used in Fireside to play video responses
 * Note: Using expo-av Video component (deprecated but stable)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { CampfireColors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: CampfireColors.BG,
  card: CampfireColors.CARD_SOLID,
  border: CampfireColors.BORDER,
  text: CampfireColors.TEXT,
  muted: CampfireColors.MUTED,
  accent: CampfireColors.BTN_PRIMARY,
};

interface VideoPlayerProps {
  uri: string;
  aspectRatio?: number; // width/height, default 9/16 (portrait)
  autoPlay?: boolean;
  showControls?: boolean;
}

export function VideoPlayer({
  uri,
  aspectRatio = 9 / 16,
  autoPlay = false,
  showControls = true,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
  const progress = duration > 0 ? position / duration : 0;

  const handlePlaybackStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    setIsLoading(!newStatus.isLoaded);

    // Auto-restart when finished
    if (newStatus.isLoaded && newStatus.didJustFinish) {
      videoRef.current?.setPositionAsync(0);
    }

    // Auto-hide overlay when playing
    if (newStatus.isLoaded && newStatus.isPlaying && showOverlay) {
      setTimeout(() => setShowOverlay(false), 2000);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      if (status?.isLoaded && status.positionMillis === status.durationMillis) {
        await videoRef.current.setPositionAsync(0);
      }
      await videoRef.current.playAsync();
    }
  };

  const handleVideoPress = () => {
    setShowOverlay(true);
    togglePlayback();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const videoWidth = SCREEN_WIDTH - 40;
  const videoHeight = videoWidth / aspectRatio;

  return (
    <View style={[styles.container, { width: videoWidth, height: videoHeight }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.videoWrapper}
        onPress={handleVideoPress}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={autoPlay}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        {/* Play/Pause overlay */}
        {showControls && showOverlay && !isLoading && (
          <View style={styles.overlay}>
            <View style={styles.playButton}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color={COLORS.text}
              />
            </View>
          </View>
        )}

        {/* Progress bar */}
        {showControls && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatTime(position)}</Text>
              <Text style={styles.time}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    marginTop: 6,
  },
  time: {
    color: COLORS.text,
    fontSize: 11,
  },
});
