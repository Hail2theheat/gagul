/**
 * VideoPlayer - Play back video recordings
 * Used in Fireside to play video responses
 */

import React, { useState, useRef, useEffect } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#0B1026',
  card: 'rgba(20, 30, 50, 0.85)',
  border: '#2a3f5f',
  text: '#FFF8DC',
  muted: '#B8A88A',
  accent: '#FF6B35',
};

interface VideoPlayerProps {
  uri: string;
  aspectRatio?: number; // width/height, default 9/16 (portrait)
  autoPlay?: boolean;
  showControls?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export function VideoPlayer({
  uri,
  aspectRatio = 9 / 16,
  autoPlay = false,
  showControls = true,
  onPlaybackStatusUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  const isPlaying = status?.isLoaded && status.isPlaying;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
  const progress = duration > 0 ? position / duration : 0;

  useEffect(() => {
    // Auto-hide overlay after playing for a bit
    if (isPlaying) {
      const timer = setTimeout(() => setShowOverlay(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  const handlePlaybackStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    setIsLoading(!newStatus.isLoaded);
    onPlaybackStatusUpdate?.(newStatus);

    // Auto-restart when finished
    if (newStatus.isLoaded && newStatus.didJustFinish) {
      videoRef.current?.setPositionAsync(0);
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
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
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
    fontVariantNumeric: 'tabular-nums',
  },
});
