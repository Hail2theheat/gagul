import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { CampfireColors } from '../constants/theme';
import { PixelCharacter, DEFAULT_CHARACTER } from './PixelCharacter';
import { useSeasonLeaderboard } from '../lib/hooks/useSeasonLeaderboard';
import {
  getSeasonName,
  getSeasonDateLabel,
  getDaysRemaining,
  getCurrentSeasonStart,
  finalizeSeason,
} from '../lib/services/seasonService';

const BG = CampfireColors.BG;
const CARD = CampfireColors.CARD_SOLID;
const BORDER = CampfireColors.BORDER;
const TEXT = CampfireColors.TEXT_CREAM;
const MUTED = CampfireColors.MUTED;

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}

export function SeasonLeaderboardModal({ visible, onClose, groupId }: Props) {
  const { data: leaderboard, isLoading, refetch } = useSeasonLeaderboard(groupId);
  const daysLeft = getDaysRemaining();
  const seasonName = getSeasonName();
  const seasonDate = getSeasonDateLabel();

  // Auto-finalize previous month on open (idempotent)
  useEffect(() => {
    if (!visible || !groupId) return;
    const now = new Date();
    if (now.getDate() <= 7) {
      // First week of month — try to finalize last month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStr = lastMonth.toISOString().split('T')[0];
      finalizeSeason(groupId, lastMonthStr).then(() => refetch());
    }
  }, [visible, groupId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: BG,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: BORDER,
          padding: 24,
          paddingBottom: 40,
          maxHeight: '80%',
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ color: '#B0D4F1', fontSize: 22, fontFamily: 'Paaxel' }}>
                {seasonName}
              </Text>
              <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Paaxel', marginTop: 2 }}>
                ({seasonDate})
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={{ padding: 8, backgroundColor: CARD, borderRadius: 8 }}
            >
              <Text style={{ color: TEXT, fontSize: 18, fontFamily: 'Paaxel' }}>X</Text>
            </Pressable>
          </View>

          {/* Leaderboard */}
          {isLoading ? (
            <ActivityIndicator color="#FF6B35" style={{ marginVertical: 40 }} />
          ) : !leaderboard || leaderboard.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: MUTED, fontSize: 16, fontFamily: 'Paaxel', textAlign: 'center' }}>
                No points scored yet this season.
              </Text>
              <Text style={{ color: MUTED, fontSize: 13, fontFamily: 'Paaxel', textAlign: 'center', marginTop: 8 }}>
                Answer prompts to climb the ranks!
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {leaderboard.map((entry, index) => (
                <View
                  key={entry.user_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: index < 3 ? 'rgba(255, 215, 0, 0.06)' : 'transparent',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  {/* Rank */}
                  <Text style={{
                    color: index < 3 ? RANK_COLORS[index] : MUTED,
                    fontSize: 18,
                    fontFamily: 'Paaxel',
                    width: 28,
                    textAlign: 'center',
                  }}>
                    {index + 1}
                  </Text>

                  {/* Avatar */}
                  <View style={{ marginHorizontal: 10 }}>
                    <PixelCharacter
                      config={entry.avatar_config || DEFAULT_CHARACTER}
                      size={28}
                    />
                  </View>

                  {/* Name */}
                  <Text style={{
                    color: TEXT,
                    fontSize: 15,
                    fontFamily: 'Paaxel',
                    flex: 1,
                  }} numberOfLines={1}>
                    {entry.username || 'Anonymous'}
                  </Text>

                  {/* Points */}
                  <Text style={{
                    color: index < 3 ? RANK_COLORS[index] : '#FF8C42',
                    fontSize: 16,
                    fontFamily: 'Paaxel',
                  }}>
                    {entry.total_points}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Season countdown */}
          <View style={{
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: BORDER,
            alignItems: 'center',
          }}>
            <Text style={{ color: MUTED, fontSize: 11, fontFamily: 'Paaxel', letterSpacing: 1 }}>
              SEASON ENDS IN
            </Text>
            <Text style={{ color: '#FF8C42', fontSize: 22, fontFamily: 'Paaxel', marginTop: 4 }}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
