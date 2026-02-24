import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Dimensions, Animated } from 'react-native';
import { CampfireColors } from '../constants/theme';
import { PixelCharacter, DEFAULT_CHARACTER } from './PixelCharacter';
import { useTrophyLeaders } from '../lib/hooks/useSeasonLeaderboard';
import type { CharacterConfig } from './pixel-character/types';

const BG = CampfireColors.BG;
const BORDER = CampfireColors.BORDER;
const TEXT_COLOR = CampfireColors.TEXT_CREAM;
const { width: SCREEN_W } = Dimensions.get('window');

// Pixel helper for throne art
const PX = ({ x, y, w, h, color, scale = 1 }: { x: number; y: number; w: number; h: number; color: string; scale?: number }) => (
  <View style={{
    position: 'absolute',
    left: x * scale,
    top: y * scale,
    width: w * scale,
    height: h * scale,
    backgroundColor: color,
  }} />
);

// ============================================================
// IRON THRONE — pixel art made of swords, blades, dark iron
// ============================================================
function IronThrone({ scale = 2.2 }: { scale?: number }) {
  const S = '#2a2a2a';
  const I = '#3d3d3d';
  const H = '#555555';
  const G = '#1a1a1a';
  const R = '#8B0000';
  const RH = '#A52A2A';
  const BL = '#4a4a5a';
  const GOLD = '#B8960C';

  return (
    <View style={{ width: 40 * scale, height: 52 * scale, position: 'relative' }}>
      {/* Sword spires */}
      <PX x={4} y={0} w={1} h={16} color={H} scale={scale} />
      <PX x={3} y={0} w={1} h={2} color={BL} scale={scale} />
      <PX x={5} y={2} w={1} h={4} color={S} scale={scale} />
      <PX x={10} y={2} w={1} h={14} color={I} scale={scale} />
      <PX x={9} y={1} w={1} h={3} color={H} scale={scale} />
      <PX x={11} y={3} w={1} h={4} color={S} scale={scale} />
      <PX x={19} y={0} w={2} h={18} color={I} scale={scale} />
      <PX x={19} y={0} w={1} h={12} color={H} scale={scale} />
      <PX x={21} y={1} w={1} h={6} color={S} scale={scale} />
      <PX x={18} y={0} w={1} h={3} color={BL} scale={scale} />
      <PX x={28} y={2} w={1} h={14} color={I} scale={scale} />
      <PX x={29} y={1} w={1} h={3} color={H} scale={scale} />
      <PX x={27} y={4} w={1} h={4} color={S} scale={scale} />
      <PX x={35} y={0} w={1} h={16} color={H} scale={scale} />
      <PX x={36} y={0} w={1} h={2} color={BL} scale={scale} />
      <PX x={34} y={3} w={1} h={4} color={S} scale={scale} />
      {/* Crossguards */}
      <PX x={2} y={16} w={5} h={1} color={GOLD} scale={scale} />
      <PX x={8} y={16} w={5} h={1} color={GOLD} scale={scale} />
      <PX x={17} y={18} w={6} h={1} color={GOLD} scale={scale} />
      <PX x={26} y={16} w={5} h={1} color={GOLD} scale={scale} />
      <PX x={33} y={16} w={5} h={1} color={GOLD} scale={scale} />
      {/* Throne back */}
      <PX x={2} y={17} w={36} h={8} color={I} scale={scale} />
      <PX x={3} y={17} w={14} h={4} color={H} scale={scale} />
      <PX x={23} y={17} w={14} h={4} color={H} scale={scale} />
      <PX x={2} y={17} w={1} h={8} color={G} scale={scale} />
      <PX x={37} y={17} w={1} h={8} color={G} scale={scale} />
      <PX x={6} y={18} w={1} h={6} color={G} scale={scale} />
      <PX x={13} y={18} w={1} h={6} color={G} scale={scale} />
      <PX x={20} y={19} w={1} h={5} color={G} scale={scale} />
      <PX x={26} y={18} w={1} h={6} color={G} scale={scale} />
      <PX x={33} y={18} w={1} h={6} color={G} scale={scale} />
      <PX x={8} y={19} w={2} h={1} color={BL} scale={scale} />
      <PX x={30} y={19} w={2} h={1} color={BL} scale={scale} />
      {/* Armrests */}
      <PX x={0} y={25} w={6} h={3} color={I} scale={scale} />
      <PX x={1} y={25} w={4} h={1} color={H} scale={scale} />
      <PX x={0} y={27} w={6} h={1} color={G} scale={scale} />
      <PX x={0} y={25} w={1} h={2} color={G} scale={scale} />
      <PX x={0} y={24} w={1} h={1} color={H} scale={scale} />
      <PX x={2} y={23} w={1} h={2} color={BL} scale={scale} />
      <PX x={34} y={25} w={6} h={3} color={I} scale={scale} />
      <PX x={35} y={25} w={4} h={1} color={H} scale={scale} />
      <PX x={34} y={27} w={6} h={1} color={G} scale={scale} />
      <PX x={39} y={25} w={1} h={2} color={G} scale={scale} />
      <PX x={39} y={24} w={1} h={1} color={H} scale={scale} />
      <PX x={37} y={23} w={1} h={2} color={BL} scale={scale} />
      {/* Seat */}
      <PX x={6} y={25} w={28} h={8} color={S} scale={scale} />
      <PX x={6} y={25} w={28} h={1} color={G} scale={scale} />
      <PX x={8} y={27} w={24} h={5} color={R} scale={scale} />
      <PX x={10} y={28} w={10} h={3} color={RH} scale={scale} />
      <PX x={22} y={28} w={8} h={3} color={RH} scale={scale} />
      <PX x={8} y={31} w={24} h={1} color={'#5a0000'} scale={scale} />
      {/* Base */}
      <PX x={4} y={33} w={32} h={4} color={S} scale={scale} />
      <PX x={5} y={33} w={12} h={2} color={I} scale={scale} />
      <PX x={23} y={33} w={12} h={2} color={I} scale={scale} />
      <PX x={4} y={36} w={32} h={1} color={G} scale={scale} />
      <PX x={10} y={34} w={1} h={2} color={G} scale={scale} />
      <PX x={20} y={34} w={1} h={2} color={G} scale={scale} />
      <PX x={30} y={34} w={1} h={2} color={G} scale={scale} />
      {/* Platform */}
      <PX x={2} y={37} w={36} h={3} color={'#2d2520'} scale={scale} />
      <PX x={2} y={37} w={36} h={1} color={'#3d332a'} scale={scale} />
      <PX x={0} y={40} w={40} h={3} color={'#251e18'} scale={scale} />
      <PX x={0} y={40} w={40} h={1} color={'#352a22'} scale={scale} />
      {/* Floor swords */}
      <PX x={1} y={42} w={8} h={1} color={H} scale={scale} />
      <PX x={31} y={42} w={8} h={1} color={I} scale={scale} />
      <PX x={15} y={43} w={10} h={1} color={S} scale={scale} />
    </View>
  );
}

function MudPuddle({ x, w }: { x: number; w: number }) {
  return (
    <View style={{ position: 'absolute', left: x, bottom: 0, width: w, height: 6 }}>
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: w, height: 3, backgroundColor: '#3d2b1a', borderRadius: 2 }} />
      <View style={{ position: 'absolute', bottom: 1, left: 2, width: w * 0.6, height: 2, backgroundColor: '#4a3520' }} />
      <View style={{ position: 'absolute', bottom: 4, left: w * 0.2, width: 3, height: 3, backgroundColor: '#3d2b1a', borderRadius: 1 }} />
      <View style={{ position: 'absolute', bottom: 3, left: w * 0.7, width: 2, height: 2, backgroundColor: '#4a3520', borderRadius: 1 }} />
    </View>
  );
}

function SlopBucket({ scale = 1.5 }: { scale?: number }) {
  return (
    <View style={{ width: 10 * scale, height: 12 * scale, position: 'relative' }}>
      <PX x={1} y={3} w={8} h={8} color="#5C3D2E" scale={scale} />
      <PX x={2} y={3} w={6} h={2} color="#7A5038" scale={scale} />
      <PX x={0} y={2} w={10} h={1} color="#4a3020" scale={scale} />
      <PX x={2} y={0} w={1} h={2} color="#3E2518" scale={scale} />
      <PX x={7} y={0} w={1} h={2} color="#3E2518" scale={scale} />
      <PX x={3} y={0} w={4} h={1} color="#3E2518" scale={scale} />
      <PX x={1} y={2} w={3} h={2} color="#6B8E23" scale={scale} />
      <PX x={0} y={3} w={1} h={2} color="#556B2F" scale={scale} />
      <PX x={0} y={11} w={4} h={1} color="#556B2F" scale={scale} />
    </View>
  );
}

// Guillotine — pixel art execution device
function Guillotine({ scale = 1.8 }: { scale?: number }) {
  return (
    <View style={{ width: 18 * scale, height: 36 * scale, position: 'relative' }}>
      {/* Vertical posts */}
      <PX x={2} y={0} w={2} h={36} color="#5C3D2E" scale={scale} />
      <PX x={14} y={0} w={2} h={36} color="#5C3D2E" scale={scale} />
      {/* Post highlights */}
      <PX x={3} y={0} w={1} h={36} color="#7A5038" scale={scale} />
      <PX x={15} y={0} w={1} h={36} color="#4a3020" scale={scale} />
      {/* Top beam */}
      <PX x={0} y={0} w={18} h={3} color="#5C3D2E" scale={scale} />
      <PX x={1} y={0} w={16} h={1} color="#7A5038" scale={scale} />
      {/* Blade (angled) */}
      <PX x={3} y={8} w={12} h={2} color="#8a8a9a" scale={scale} />
      <PX x={4} y={7} w={10} h={1} color="#aaaabc" scale={scale} />
      <PX x={5} y={10} w={8} h={1} color="#6a6a7a" scale={scale} />
      {/* Blade edge (sharp) */}
      <PX x={3} y={10} w={12} h={1} color="#ccccdd" scale={scale} />
      {/* Rope */}
      <PX x={9} y={3} w={1} h={5} color="#8B7355" scale={scale} />
      {/* Lunette (neck hole) */}
      <PX x={5} y={28} w={8} h={3} color="#4a3020" scale={scale} />
      <PX x={6} y={27} w={6} h={1} color="#5C3D2E" scale={scale} />
      <PX x={7} y={29} w={4} h={3} color="#1a150e" scale={scale} />
      {/* Base platform */}
      <PX x={0} y={33} w={18} h={3} color="#4a3020" scale={scale} />
      <PX x={1} y={33} w={16} h={1} color="#5C3D2E" scale={scale} />
    </View>
  );
}

// Wandering pig — small pink pixel pig that drifts left-right
function WanderingPig({ startX, bottom, range = 40, delay = 0 }: { startX: number; bottom: number; range?: number; delay?: number }) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(translateX, { toValue: range / 2, duration: 2000 + Math.random() * 1500, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -range / 2, duration: 2000 + Math.random() * 1500, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: range / 4, duration: 1500 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -range / 4, duration: 1500 + Math.random() * 1000, useNativeDriver: true }),
      ]).start(() => animate());
    };
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: startX, bottom,
      transform: [{ translateX }],
    }}>
      {/* Body */}
      <View style={{ width: 10, height: 6, backgroundColor: '#F5B7B1', borderRadius: 2 }} />
      {/* Head */}
      <View style={{ position: 'absolute', left: -3, top: 0, width: 5, height: 5, backgroundColor: '#F5B7B1', borderRadius: 2 }} />
      {/* Snout */}
      <View style={{ position: 'absolute', left: -5, top: 1, width: 3, height: 3, backgroundColor: '#E8A0A0', borderRadius: 1.5 }} />
      {/* Nostrils */}
      <View style={{ position: 'absolute', left: -4, top: 2, width: 1, height: 1, backgroundColor: '#C07070' }} />
      {/* Eye */}
      <View style={{ position: 'absolute', left: -1, top: 1, width: 1, height: 1, backgroundColor: '#333' }} />
      {/* Ears */}
      <View style={{ position: 'absolute', left: -2, top: -2, width: 2, height: 2, backgroundColor: '#E8A0A0', borderRadius: 1 }} />
      {/* Legs */}
      <View style={{ position: 'absolute', left: 1, bottom: -3, width: 2, height: 3, backgroundColor: '#E8A0A0' }} />
      <View style={{ position: 'absolute', left: 4, bottom: -3, width: 2, height: 3, backgroundColor: '#E8A0A0' }} />
      <View style={{ position: 'absolute', left: 7, bottom: -3, width: 2, height: 3, backgroundColor: '#E8A0A0' }} />
      {/* Tail (curly) */}
      <View style={{ position: 'absolute', right: -3, top: 0, width: 3, height: 3, borderWidth: 1, borderColor: '#E8A0A0', borderRadius: 1.5, backgroundColor: 'transparent' }} />
    </Animated.View>
  );
}

// Wooden chair — simple pixel art stool/chair
function WoodenChair({ scale = 1.4, flip = false }: { scale?: number; flip?: boolean }) {
  return (
    <View style={{ width: 12 * scale, height: 16 * scale, position: 'relative', transform: flip ? [{ scaleX: -1 }] : [] }}>
      {/* Back rest */}
      <PX x={1} y={0} w={2} h={10} color="#5C3D2E" scale={scale} />
      <PX x={2} y={0} w={1} h={10} color="#7A5038" scale={scale} />
      {/* Back support bar */}
      <PX x={1} y={2} w={8} h={2} color="#5C3D2E" scale={scale} />
      <PX x={2} y={2} w={6} h={1} color="#6B4830" scale={scale} />
      {/* Seat */}
      <PX x={0} y={9} w={10} h={2} color="#5C3D2E" scale={scale} />
      <PX x={1} y={9} w={8} h={1} color="#7A5038" scale={scale} />
      {/* Front legs */}
      <PX x={1} y={11} w={2} h={5} color="#4a3020" scale={scale} />
      <PX x={7} y={11} w={2} h={5} color="#4a3020" scale={scale} />
      {/* Back legs */}
      <PX x={1} y={10} w={1} h={6} color="#3E2518" scale={scale} />
    </View>
  );
}

// Pixel spear — standing upright
function PixelSpear({ scale = 1.4 }: { scale?: number }) {
  return (
    <View style={{ width: 4 * scale, height: 28 * scale, position: 'relative' }}>
      {/* Shaft */}
      <PX x={1} y={6} w={2} h={22} color="#6B4830" scale={scale} />
      <PX x={2} y={8} w={1} h={18} color="#5C3D2E" scale={scale} />
      {/* Spear tip */}
      <PX x={1} y={0} w={2} h={6} color="#8a8a9a" scale={scale} />
      <PX x={0} y={2} w={1} h={3} color="#6a6a7a" scale={scale} />
      <PX x={3} y={2} w={1} h={3} color="#6a6a7a" scale={scale} />
      <PX x={1} y={0} w={2} h={2} color="#aaaabc" scale={scale} />
    </View>
  );
}

// Armour stand — breastplate on a wooden post
function ArmourStand({ scale = 1.5 }: { scale?: number }) {
  return (
    <View style={{ width: 14 * scale, height: 24 * scale, position: 'relative' }}>
      {/* Wooden post */}
      <PX x={6} y={14} w={2} h={10} color="#5C3D2E" scale={scale} />
      <PX x={7} y={16} w={1} h={7} color="#4a3020" scale={scale} />
      {/* Base */}
      <PX x={3} y={22} w={8} h={2} color="#4a3020" scale={scale} />
      <PX x={4} y={22} w={6} h={1} color="#5C3D2E" scale={scale} />
      {/* Cross bar (shoulders) */}
      <PX x={1} y={8} w={12} h={2} color="#5C3D2E" scale={scale} />
      {/* Breastplate */}
      <PX x={3} y={4} w={8} h={10} color="#6a6a7a" scale={scale} />
      <PX x={4} y={4} w={6} h={3} color="#8a8a9a" scale={scale} />
      <PX x={5} y={5} w={4} h={2} color="#aaaabc" scale={scale} />
      {/* Breastplate shadow */}
      <PX x={3} y={12} w={8} h={2} color="#555565" scale={scale} />
      {/* Chainmail peek */}
      <PX x={4} y={13} w={6} h={1} color="#5a5a6a" scale={scale} />
      {/* Helmet on top */}
      <PX x={4} y={0} w={6} h={4} color="#7a7a8a" scale={scale} />
      <PX x={5} y={0} w={4} h={1} color="#9a9aaa" scale={scale} />
      <PX x={3} y={3} w={8} h={1} color="#6a6a7a" scale={scale} />
      {/* Visor slit */}
      <PX x={5} y={2} w={4} h={1} color="#333" scale={scale} />
    </View>
  );
}

// Royal banner — hanging tapestry with crest
function RoyalBanner({ color, crestColor, width = 20, height = 30, scale = 1 }: { color: string; crestColor: string; width?: number; height?: number; scale?: number }) {
  return (
    <View style={{ width: width * scale, height: height * scale, position: 'relative' }}>
      {/* Rod */}
      <PX x={0} y={0} w={width} h={1} color="#B8960C" scale={scale} />
      {/* Banner fabric */}
      <PX x={1} y={1} w={width - 2} h={height - 4} color={color} scale={scale} />
      {/* Fringe border */}
      <PX x={1} y={1} w={1} h={height - 4} color="#B8960C" scale={scale} />
      <PX x={width - 2} y={1} w={1} h={height - 4} color="#B8960C" scale={scale} />
      {/* Crest — shield shape */}
      <PX x={Math.floor(width / 2) - 3} y={6} w={6} h={8} color={crestColor} scale={scale} />
      <PX x={Math.floor(width / 2) - 2} y={5} w={4} h={1} color={crestColor} scale={scale} />
      <PX x={Math.floor(width / 2) - 2} y={14} w={4} h={1} color={crestColor} scale={scale} />
      <PX x={Math.floor(width / 2) - 1} y={15} w={2} h={1} color={crestColor} scale={scale} />
      {/* Cross on crest */}
      <PX x={Math.floor(width / 2)} y={7} w={1} h={6} color="#B8960C" scale={scale} />
      <PX x={Math.floor(width / 2) - 2} y={9} w={5} h={1} color="#B8960C" scale={scale} />
      {/* Bottom V-cut */}
      <PX x={1} y={height - 3} w={Math.floor((width - 2) / 2)} h={2} color={color} scale={scale} />
      <PX x={Math.floor(width / 2)} y={height - 3} w={Math.floor((width - 2) / 2)} h={2} color={color} scale={scale} />
      <PX x={Math.floor(width / 2) - 1} y={height - 1} w={2} h={1} color={color} scale={scale} />
    </View>
  );
}

// Stone divider between tiers
function StoneDivider({ thick = false }: { thick?: boolean }) {
  return (
    <View style={{
      width: SCREEN_W - 40,
      height: thick ? 6 : 4,
      backgroundColor: '#3d332a',
      marginVertical: thick ? 12 : 8,
      borderTopWidth: 1,
      borderTopColor: '#4a4038',
      borderBottomWidth: thick ? 1 : 0,
      borderBottomColor: '#2a2018',
    }} />
  );
}

// Tier label
function TierLabel({ text, color }: { text: string; color: string }) {
  return (
    <Text style={{
      color,
      fontSize: 10,
      fontFamily: 'Paaxel',
      letterSpacing: 2,
      marginBottom: 8,
    }}>
      {text}
    </Text>
  );
}

// Avatar row for populated tiers
function AvatarRow({ members, labelColor = TEXT_COLOR, showTrophies = false, trophyMap = {} }: {
  members: MemberData[];
  labelColor?: string;
  showTrophies?: boolean;
  trophyMap?: Record<string, number>;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    }}>
      {members.map((m) => (
        <View key={m.user_id} style={{ alignItems: 'center' }}>
          <PixelCharacter config={m.avatar_config || DEFAULT_CHARACTER} size={30} />
          {showTrophies && trophyMap[m.user_id] && (
            <Text style={{ color: '#FFD700', fontSize: 9, fontFamily: 'Paaxel', marginTop: 1 }}>
              {"🏆"} x{trophyMap[m.user_id]}
            </Text>
          )}
          <Text style={{ color: labelColor, fontSize: 8, fontFamily: 'Paaxel', marginTop: 1 }} numberOfLines={1}>
            {m.username || '???'}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface MemberData {
  user_id: string;
  avatar_config: CharacterConfig | null;
  username: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  members?: MemberData[];
}

export function TrophyLeadersModal({ visible, onClose, groupId, members = [] }: Props) {
  const { data: leaders } = useTrophyLeaders(groupId);

  // Build trophy count map from leaders data
  const trophyMap: Record<string, number> = {};
  (leaders || []).forEach((l) => { trophyMap[l.user_id] = l.trophy_count; });

  // Sort members into tiers based on trophy count
  // Iron Throne: most all-time wins (top 1 by trophy count, needs most trophies)
  // Knights: 3+ season wins
  // Squires: 1-2 season wins
  // Peasants: 0 wins
  const allTrophied = (leaders || []).sort((a, b) => b.trophy_count - a.trophy_count);
  const throneHolder = allTrophied.length > 0 ? allTrophied[0] : null;

  const knightIds = new Set<string>();
  const squireIds = new Set<string>();
  const throneId = throneHolder?.user_id;

  allTrophied.forEach((l) => {
    if (l.user_id === throneId) return; // throne holder separate
    if (l.trophy_count >= 3) knightIds.add(l.user_id);
    else squireIds.add(l.user_id);
  });

  const knights = members.filter((m) => knightIds.has(m.user_id));
  const squires = members.filter((m) => squireIds.has(m.user_id));
  const peasants = members.filter((m) =>
    m.user_id !== throneId && !knightIds.has(m.user_id) && !squireIds.has(m.user_id)
  );
  const throneMembers = throneHolder ? members.filter((m) => m.user_id === throneId) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute', top: 56, right: 20, zIndex: 10,
            padding: 8, backgroundColor: 'rgba(20, 30, 50, 0.8)', borderRadius: 8,
            borderWidth: 1, borderColor: BORDER,
          }}
        >
          <Text style={{ color: TEXT_COLOR, fontSize: 18, fontFamily: 'Paaxel' }}>X</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingTop: 50, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ========== TIER 1: THE IRON THRONE ========== */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <TierLabel text="THE IRON THRONE" color="#888" />

            <IronThrone scale={2.4} />

            {throneMembers.length > 0 ? (
              <View style={{ alignItems: 'center', marginTop: 8 }}>
                <PixelCharacter config={throneMembers[0].avatar_config || DEFAULT_CHARACTER} size={40} />
                <Text style={{ color: '#FFD700', fontSize: 11, fontFamily: 'Paaxel', marginTop: 4 }}>
                  {"🏆"} x{trophyMap[throneMembers[0].user_id] || 0}
                </Text>
                <Text style={{ color: TEXT_COLOR, fontSize: 10, fontFamily: 'Paaxel' }} numberOfLines={1}>
                  {throneMembers[0].username || '???'}
                </Text>
              </View>
            ) : (
              <View style={{
                marginTop: 8,
                backgroundColor: 'rgba(30, 30, 30, 0.6)',
                paddingVertical: 4, paddingHorizontal: 16,
                borderRadius: 4, borderWidth: 1, borderColor: '#333',
              }}>
                <Text style={{ color: '#555', fontSize: 11, fontFamily: 'Paaxel', letterSpacing: 3 }}>
                  UNCLAIMED
                </Text>
              </View>
            )}

            <Text style={{ color: '#444', fontSize: 9, fontFamily: 'Paaxel', fontStyle: 'italic', marginTop: 6 }}>
              most season victories of all time
            </Text>
          </View>

          <StoneDivider thick />

          {/* ========== TIER 2: KNIGHTS QUARTER (3+ wins) ========== */}
          <View style={{ alignItems: 'center', marginBottom: 4, width: SCREEN_W - 40 }}>
            <TierLabel text="KNIGHTS QUARTER" color="#B8960C" />

            <View style={{
              width: '100%',
              backgroundColor: '#2a2520',
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#4a3828',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Stone wall texture */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {[0, 24, 48, 72].map((row, ri) => (
                  <View key={`wall-${ri}`} style={{ flexDirection: 'row', position: 'absolute', top: row, left: ri % 2 === 0 ? 0 : -15 }}>
                    {[...Array(12)].map((_, ci) => (
                      <View key={ci} style={{
                        width: 30, height: 12, marginRight: 2, marginBottom: 2,
                        backgroundColor: (ri + ci) % 3 === 0 ? '#2e2820' : (ri + ci) % 3 === 1 ? '#2a2418' : '#322a20',
                        borderWidth: 0.5, borderColor: '#1e1a14',
                      }} />
                    ))}
                  </View>
                ))}
              </View>

              {/* Hanging royal banners */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6, zIndex: 2 }}>
                <RoyalBanner color="#8B0000" crestColor="#B8960C" scale={0.9} />
                <View style={{ flex: 1 }} />
                <RoyalBanner color="#1a3a6a" crestColor="#C0C0C0" scale={0.9} />
              </View>

              {/* Ornate torch sconces */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6, zIndex: 2 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#FF8C42', borderRadius: 4, shadowColor: '#FF6B35', shadowOpacity: 0.6, shadowRadius: 8 }} />
                  <View style={{ width: 3, height: 14, backgroundColor: '#5C3D2E' }} />
                  <View style={{ width: 10, height: 3, backgroundColor: '#4a3020', borderRadius: 1 }} />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#FF8C42', borderRadius: 4, shadowColor: '#FF6B35', shadowOpacity: 0.6, shadowRadius: 8 }} />
                  <View style={{ width: 3, height: 14, backgroundColor: '#5C3D2E' }} />
                  <View style={{ width: 10, height: 3, backgroundColor: '#4a3020', borderRadius: 1 }} />
                </View>
              </View>

              {/* Gold-trimmed banner */}
              <View style={{
                backgroundColor: '#8B0000', paddingVertical: 4, paddingHorizontal: 24,
                marginBottom: 8, borderWidth: 1.5, borderColor: '#B8960C',
                zIndex: 2,
              }}>
                <Text style={{ color: '#FFD700', fontSize: 9, fontFamily: 'Paaxel', letterSpacing: 2 }}>
                  3+ SEASON VICTORIES
                </Text>
              </View>

              {/* Knight avatars */}
              <View style={{ zIndex: 2 }}>
                {knights.length > 0 ? (
                  <AvatarRow members={knights} showTrophies trophyMap={trophyMap} />
                ) : (
                  <Text style={{ color: '#5a4a38', fontSize: 12, fontFamily: 'Paaxel', fontStyle: 'italic', textAlign: 'center' }}>
                    Win 3 seasons to be knighted
                  </Text>
                )}
              </View>

              {/* Polished stone floor */}
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 1, zIndex: 2 }}>
                {[...Array(10)].map((_, i) => (
                  <View key={i} style={{
                    width: (SCREEN_W - 80) / 10, height: 6,
                    backgroundColor: i % 2 === 0 ? '#3a3228' : '#2e2820',
                    borderWidth: 0.5, borderColor: '#1e1a14',
                  }} />
                ))}
              </View>

              {/* Shield decorations on floor edges */}
              <View style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 3 }}>
                <View style={{ width: 12, height: 14, backgroundColor: '#8B0000', borderRadius: 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>
                  <View style={{ position: 'absolute', top: 2, left: 3, width: 6, height: 1, backgroundColor: '#B8960C' }} />
                  <View style={{ position: 'absolute', top: 5, left: 5, width: 2, height: 6, backgroundColor: '#B8960C' }} />
                </View>
              </View>
              <View style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 3 }}>
                <View style={{ width: 12, height: 14, backgroundColor: '#1a3a6a', borderRadius: 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>
                  <View style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderWidth: 1, borderColor: '#C0C0C0', borderRadius: 3 }} />
                </View>
              </View>
            </View>
          </View>

          <StoneDivider />

          {/* ========== TIER 3: SQUIRES BARRACKS (1-2 wins) ========== */}
          <View style={{ alignItems: 'center', marginBottom: 4, width: SCREEN_W - 40 }}>
            <TierLabel text="SQUIRES BARRACKS" color="#5a5040" />

            <View style={{
              width: '100%',
              backgroundColor: '#221e18',
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#332a22',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Weapon rack on wall */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
                <View style={{ width: 120, height: 4, backgroundColor: '#5C3D2E', borderRadius: 1 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                {/* Swords hanging from rack */}
                <View style={{ width: 2, height: 18, backgroundColor: '#6a6a7a', transform: [{ rotate: '-8deg' }] }} />
                <View style={{ width: 2, height: 15, backgroundColor: '#555565', transform: [{ rotate: '5deg' }] }} />
                <View style={{ width: 2, height: 20, backgroundColor: '#7a7a8a', transform: [{ rotate: '-3deg' }] }} />
                <View style={{ width: 2, height: 14, backgroundColor: '#555565', transform: [{ rotate: '10deg' }] }} />
                <View style={{ width: 2, height: 17, backgroundColor: '#6a6a7a', transform: [{ rotate: '-6deg' }] }} />
              </View>

              {/* Spears flanking sides */}
              <View style={{ position: 'absolute', top: 8, left: 12 }}>
                <PixelSpear scale={1.2} />
              </View>
              <View style={{ position: 'absolute', top: 8, left: 24 }}>
                <PixelSpear scale={1.0} />
              </View>
              <View style={{ position: 'absolute', top: 8, right: 12 }}>
                <PixelSpear scale={1.2} />
              </View>
              <View style={{ position: 'absolute', top: 8, right: 24 }}>
                <PixelSpear scale={1.0} />
              </View>

              {/* Armour stands on sides */}
              <View style={{ position: 'absolute', top: 40, left: 10 }}>
                <ArmourStand scale={1.2} />
              </View>
              <View style={{ position: 'absolute', top: 40, right: 10 }}>
                <ArmourStand scale={1.2} />
              </View>

              {/* Green banner */}
              <View style={{
                backgroundColor: '#2a4a2a', paddingVertical: 3, paddingHorizontal: 18,
                marginBottom: 8, borderWidth: 1, borderColor: '#1a3a1a',
              }}>
                <Text style={{ color: '#6a8a4a', fontSize: 9, fontFamily: 'Paaxel', letterSpacing: 1 }}>
                  1+ SEASON VICTORY
                </Text>
              </View>

              {/* Squire avatars */}
              {squires.length > 0 ? (
                <AvatarRow members={squires} labelColor="#5a5040" showTrophies trophyMap={trophyMap} />
              ) : (
                <Text style={{ color: '#3a3528', fontSize: 12, fontFamily: 'Paaxel', fontStyle: 'italic', textAlign: 'center' }}>
                  Win a season to earn your sword
                </Text>
              )}

              {/* Wooden chairs scattered around floor */}
              <View style={{ position: 'absolute', bottom: 8, left: 40 }}>
                <WoodenChair scale={1.1} />
              </View>
              <View style={{ position: 'absolute', bottom: 10, right: 45 }}>
                <WoodenChair scale={1.0} flip />
              </View>
              <View style={{ position: 'absolute', bottom: 6, left: SCREEN_W / 2 - 40 }}>
                <WoodenChair scale={0.9} />
              </View>

              {/* Rough wooden floor */}
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 2 }}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={{
                    width: (SCREEN_W - 80) / 8, height: 4,
                    backgroundColor: i % 2 === 0 ? '#2a2418' : '#332a1e',
                    borderWidth: 0.5, borderColor: '#1e1a10',
                  }} />
                ))}
              </View>

              {/* Straw on floor */}
              {[20, 70, 130, 180, 240].map((lx, i) => (
                <View key={`sq-straw-${i}`} style={{
                  position: 'absolute', bottom: 4 + (i % 2) * 2, left: lx,
                  width: 10 + i * 2, height: 1, backgroundColor: '#6B5B3A',
                  transform: [{ rotate: `${i * 18 - 15}deg` }],
                }} />
              ))}
            </View>
          </View>

          <StoneDivider />

          {/* ========== TIER 4: THE PEASANT PIT ========== */}
          <View style={{ alignItems: 'center', width: SCREEN_W - 40 }}>
            <TierLabel text="THE PEASANT PIT" color="#5C4A32" />

            <View style={{
              width: '100%',
              position: 'relative',
              backgroundColor: '#1a150e',
              borderWidth: 1,
              borderColor: '#2a2218',
              paddingTop: 16,
              paddingBottom: 24,
              paddingHorizontal: 8,
              overflow: 'hidden',
            }}>
              {/* Dripping water */}
              {[20, 45, 70, 85].map((pct, i) => (
                <View key={`drip-${i}`} style={{
                  position: 'absolute', top: 0, left: `${pct}%`,
                  width: 2, height: 6 + (i * 3),
                  backgroundColor: 'rgba(80, 120, 160, 0.15)',
                }} />
              ))}

              {/* Mud floor */}
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 16,
                backgroundColor: '#2a1f14',
              }}>
                <View style={{ position: 'absolute', top: 0, left: 10, width: 30, height: 3, backgroundColor: '#3d2b1a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', top: 2, left: 60, width: 40, height: 3, backgroundColor: '#33251a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', top: 1, left: 120, width: 25, height: 3, backgroundColor: '#3d2b1a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', top: 4, left: 180, width: 35, height: 2, backgroundColor: '#33251a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', top: 6, left: 40, width: 20, height: 2, backgroundColor: 'rgba(80, 60, 40, 0.3)', borderRadius: 1 }} />
                <View style={{ position: 'absolute', top: 8, left: 150, width: 15, height: 2, backgroundColor: 'rgba(80, 60, 40, 0.3)', borderRadius: 1 }} />
              </View>

              {/* Mud puddles */}
              <MudPuddle x={15} w={30} />
              <MudPuddle x={90} w={25} />
              <MudPuddle x={200} w={35} />

              {/* Slop buckets */}
              <View style={{ position: 'absolute', bottom: 14, left: 8 }}>
                <SlopBucket scale={1.2} />
              </View>

              {/* Guillotine — bottom right */}
              <View style={{ position: 'absolute', bottom: 14, right: 10 }}>
                <Guillotine scale={1.5} />
              </View>

              {/* Wandering pigs */}
              <WanderingPig startX={40} bottom={20} range={50} delay={0} />
              <WanderingPig startX={120} bottom={18} range={35} delay={800} />
              <WanderingPig startX={80} bottom={22} range={45} delay={1500} />

              {/* Rats */}
              <View style={{ position: 'absolute', bottom: 18, left: 55 }}>
                <View style={{ width: 5, height: 3, backgroundColor: '#4a3a2a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', right: -3, top: 1, width: 4, height: 1, backgroundColor: '#5a4a3a' }} />
                <View style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, backgroundColor: '#222' }} />
              </View>
              <View style={{ position: 'absolute', bottom: 16, right: 50 }}>
                <View style={{ width: 4, height: 3, backgroundColor: '#3a2a1a', borderRadius: 1 }} />
                <View style={{ position: 'absolute', left: -3, top: 1, width: 4, height: 1, backgroundColor: '#4a3a2a' }} />
                <View style={{ position: 'absolute', right: 0, top: 0, width: 1, height: 1, backgroundColor: '#222' }} />
              </View>

              {/* Straw */}
              {[25, 75, 130, 165, 230].map((lx, i) => (
                <View key={`straw-${i}`} style={{
                  position: 'absolute', bottom: 14 + (i % 3) * 2, left: lx,
                  width: 8 + (i * 2), height: 1, backgroundColor: '#6B5B3A',
                  transform: [{ rotate: `${(i * 15) - 20}deg` }],
                }} />
              ))}

              {/* Peasant avatars */}
              {peasants.length > 0 ? (
                <AvatarRow members={peasants} labelColor="#5C4A32" />
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ color: '#4a3a28', fontSize: 12, fontFamily: 'Paaxel' }}>
                    * sounds of rats *
                  </Text>
                </View>
              )}

              <Text style={{
                color: '#3a2e1e', fontSize: 9, fontFamily: 'Paaxel',
                textAlign: 'center', fontStyle: 'italic', marginTop: 4,
              }}>
                win a season to escape the pit
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
