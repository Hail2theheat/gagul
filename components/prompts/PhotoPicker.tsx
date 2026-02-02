/**
 * PhotoPicker - camera/gallery picker with preview
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// Theme colors
const COLORS = {
  bg: '#0D1426',
  border: '#27406B',
  text: '#E6F0FF',
  muted: '#9EC5FF',
  btn: '#1E4ED8',
};

interface PhotoPickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
}

export function PhotoPicker({ value, onChange, disabled = false }: PhotoPickerProps) {
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (disabled) return;

    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Camera permission is required to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Photo library permission is required to select photos');
          return;
        }
      }

      setLoading(true);

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    onChange(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.btn} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (value) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.preview} />
          {!disabled && (
            <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
              <Ionicons name="close-circle" size={28} color="#FF4444" />
            </TouchableOpacity>
          )}
        </View>
        {!disabled && (
          <View style={styles.changeRow}>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => pickImage(true)}
            >
              <Ionicons name="camera-outline" size={18} color={COLORS.muted} />
              <Text style={styles.changeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => pickImage(false)}
            >
              <Ionicons name="images-outline" size={18} color={COLORS.muted} />
              <Text style={styles.changeText}>Choose another</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.disabled]}
          onPress={() => pickImage(true)}
          disabled={disabled}
        >
          <Ionicons name="camera" size={32} color={COLORS.btn} />
          <Text style={styles.pickerLabel}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.disabled]}
          onPress={() => pickImage(false)}
          disabled={disabled}
        >
          <Ionicons name="images" size={32} color={COLORS.btn} />
          <Text style={styles.pickerLabel}>Choose Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
  loadingBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  previewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
  },
  clearButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#070B14',
    borderRadius: 14,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});

export default PhotoPicker;
