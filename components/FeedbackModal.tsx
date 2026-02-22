import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { CampfireColors, Spacing, Radii, Typography } from "../constants/theme";
import { submitFeedback } from "../lib/services/feedbackService";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  groupId?: string;
  weekOf?: string;
  source: "fireside" | "general";
}

export function FeedbackModal({ visible, onClose, groupId, weekOf, source }: FeedbackModalProps) {
  const [text, setText] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setScreenshotUri(null);
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await submitFeedback({
      content: text.trim(),
      groupId,
      weekOf,
      source,
      screenshotUri: screenshotUri || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setTimeout(handleClose, 1500);
    } else {
      setError(result.error || "Something went wrong. Try again!");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: CampfireColors.BG_MID,
              borderColor: CampfireColors.CARD_BORDER,
              borderWidth: 1,
              borderTopLeftRadius: Radii.modal,
              borderTopRightRadius: Radii.modal,
              padding: Spacing.xxl,
              paddingBottom: 40,
            }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: "center", marginBottom: Spacing.lg }}>
              <View style={{ width: 40, height: 4, backgroundColor: CampfireColors.CARD_BORDER, borderRadius: 2 }} />
            </View>

            {submitted ? (
              // Success state
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="checkmark-circle" size={48} color={CampfireColors.SUCCESS} />
                <Text style={{ color: CampfireColors.TEXT_WARM, ...Typography.heading2, marginTop: 16 }}>
                  Thanks!
                </Text>
                <Text style={{ color: CampfireColors.MUTED, ...Typography.body, marginTop: 8, textAlign: "center" }}>
                  Your feedback is anonymous.
                </Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <Text style={{ color: CampfireColors.TEXT_WARM, ...Typography.heading2, marginBottom: 6 }}>
                  Anonymous Feedback
                </Text>
                <Text style={{ color: CampfireColors.MUTED, ...Typography.body, fontSize: 13, marginBottom: Spacing.lg }}>
                  Be brutally honest — what do you like and what don't you like?
                </Text>

                {/* Text input */}
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Tell us what you really think..."
                  placeholderTextColor="#6B6058"
                  multiline
                  maxLength={1000}
                  style={{
                    backgroundColor: CampfireColors.INPUT_BG,
                    borderColor: CampfireColors.CARD_BORDER,
                    borderWidth: 1,
                    borderRadius: Radii.card,
                    padding: Spacing.md,
                    color: CampfireColors.TEXT,
                    ...Typography.body,
                    fontSize: 15,
                    minHeight: 120,
                    textAlignVertical: "top",
                  }}
                />
                <Text style={{ color: CampfireColors.MUTED, fontSize: 11, textAlign: "right", marginTop: 4 }}>
                  {text.length}/1000
                </Text>

                {/* Screenshot */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.md, gap: 12 }}>
                  <TouchableOpacity
                    onPress={pickScreenshot}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: CampfireColors.INPUT_BG,
                      borderColor: CampfireColors.CARD_BORDER,
                      borderWidth: 1,
                      borderRadius: Radii.card,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons name="image-outline" size={18} color={CampfireColors.MUTED} />
                    <Text style={{ color: CampfireColors.MUTED, ...Typography.body, fontSize: 13, marginLeft: 6 }}>
                      {screenshotUri ? "Change Screenshot" : "Add Screenshot"}
                    </Text>
                  </TouchableOpacity>

                  {screenshotUri && (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: screenshotUri }}
                        style={{ width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: CampfireColors.CARD_BORDER }}
                      />
                      <TouchableOpacity
                        onPress={() => setScreenshotUri(null)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          backgroundColor: CampfireColors.DANGER,
                          borderRadius: 10,
                          width: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Error message */}
                {error && (
                  <Text style={{ color: CampfireColors.DANGER, ...Typography.body, fontSize: 13, marginTop: Spacing.sm, textAlign: "center" }}>
                    {error}
                  </Text>
                )}

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting}
                  style={{
                    backgroundColor: text.trim() ? CampfireColors.BTN_PRIMARY : CampfireColors.BTN_OUTLINE,
                    padding: 16,
                    borderRadius: Radii.card,
                    alignItems: "center",
                    marginTop: Spacing.lg,
                    opacity: text.trim() ? 1 : 0.5,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={CampfireColors.TEXT} />
                  ) : (
                    <Text style={{ color: CampfireColors.TEXT, ...Typography.body, fontSize: 16, fontFamily: "Paaxel" }}>
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
