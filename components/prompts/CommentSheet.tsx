/**
 * CommentSheet - Instagram/TikTok style threaded comments
 * Slides up from bottom, shows comments with replies
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCommentsWithReplies,
  addComment,
  addCommentReply,
  subscribeToComments,
  FiresideComment,
} from '../../lib/services/firesideService';
import { trackInteraction } from '../../lib/services/metricsService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

const COLORS = {
  bg: '#0A0A0F',
  card: '#1A1A2E',
  border: '#2D2D44',
  text: '#F5F5F5',
  muted: '#9CA3AF',
  accent: '#FF6B35',
  purple: '#8B5CF6',
};

interface CommentSheetProps {
  visible: boolean;
  responseId: string;
  onClose: () => void;
}

export function CommentSheet({ visible, responseId, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<FiresideComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<FiresideComment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadComments();
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Subscribe to new comments
      const unsubscribe = subscribeToComments(responseId, () => {
        loadComments();
      });

      return unsubscribe;
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, responseId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await getCommentsWithReplies(responseId);
    setComments(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const content = newComment.trim();
    setNewComment('');

    try {
      if (replyingTo) {
        // Add reply
        await addCommentReply(replyingTo.id, content);
        setReplyingTo(null);
        // Expand replies for this comment
        setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
      } else {
        // Add top-level comment
        await addComment(responseId, content);
      }

      trackInteraction('comment', { responseId });
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      setNewComment(content); // Restore on error
    }

    setSubmitting(false);
  };

  const handleReply = (comment: FiresideComment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderComment = ({ item: comment }: { item: FiresideComment }) => {
    const isExpanded = expandedReplies.has(comment.id);
    const hasReplies = (comment.reply_count || 0) > 0 || (comment.replies?.length || 0) > 0;

    return (
      <View style={styles.commentContainer}>
        {/* Main comment */}
        <View style={styles.comment}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(comment.username || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.username}>
                {comment.username || `User ${comment.user_id.slice(0, 6)}`}
              </Text>
              <Text style={styles.timestamp}>{formatTime(comment.created_at)}</Text>
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => handleReply(comment)}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Replies toggle */}
        {hasReplies && (
          <TouchableOpacity
            style={styles.repliesToggle}
            onPress={() => toggleReplies(comment.id)}
          >
            <View style={styles.repliesLine} />
            <Text style={styles.repliesToggleText}>
              {isExpanded
                ? 'Hide replies'
                : `View ${comment.reply_count || comment.replies?.length || 0} replies`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Replies */}
        {isExpanded && comment.replies && comment.replies.length > 0 && (
          <View style={styles.replies}>
            {comment.replies.map(reply => (
              <View key={reply.id} style={styles.reply}>
                <View style={styles.replyAvatar}>
                  <Text style={styles.replyAvatarText}>
                    {(reply.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.replyContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.replyUsername}>
                      {reply.username || `User ${reply.user_id.slice(0, 6)}`}
                    </Text>
                    <Text style={styles.timestamp}>{formatTime(reply.created_at)}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          {/* Handle */}
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {loading ? 'Loading...' : 'No comments yet. Be the first!'}
                </Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            {replyingTo && (
              <View style={styles.replyingTo}>
                <Text style={styles.replyingToText}>
                  Replying to {replyingTo.username || `User ${replyingTo.user_id.slice(0, 6)}`}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                placeholderTextColor={COLORS.muted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newComment.trim() || submitting) && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newComment.trim() && !submitting ? COLORS.text : COLORS.muted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    flex: 1,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  commentContainer: {
    marginBottom: 20,
  },
  comment: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.muted,
    fontSize: 12,
  },
  commentText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  replyButton: {
    marginTop: 8,
  },
  replyButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 48,
    marginTop: 12,
    gap: 8,
  },
  repliesLine: {
    width: 24,
    height: 1,
    backgroundColor: COLORS.border,
  },
  repliesToggleText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  replies: {
    marginLeft: 48,
    marginTop: 12,
    gap: 12,
  },
  reply: {
    flexDirection: 'row',
    gap: 10,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  replyText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.card,
  },
});
