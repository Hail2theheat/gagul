/**
 * CountdownTimer - displays time remaining until prompt expires
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTimeRemaining } from '../../lib/services/promptService';

// Theme colors
const COLORS = {
  text: '#E6F0FF',
  muted: '#9EC5FF',
  warning: '#FFA500',
  urgent: '#FF4444',
};

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeLeft(remaining);

      if (remaining.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  // Determine color based on urgency
  const getColor = () => {
    if (timeLeft.expired) return COLORS.urgent;
    if (timeLeft.totalSeconds < 300) return COLORS.urgent; // < 5 min
    if (timeLeft.totalSeconds < 3600) return COLORS.warning; // < 1 hour
    return COLORS.muted;
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft.expired) {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: COLORS.urgent }]}>Expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: COLORS.muted }]}>Time left</Text>
      <View style={styles.timerRow}>
        {timeLeft.hours > 0 && (
          <>
            <View style={styles.unit}>
              <Text style={[styles.number, { color: getColor() }]}>
                {formatNumber(timeLeft.hours)}
              </Text>
              <Text style={styles.unitLabel}>hr</Text>
            </View>
            <Text style={[styles.colon, { color: getColor() }]}>:</Text>
          </>
        )}
        <View style={styles.unit}>
          <Text style={[styles.number, { color: getColor() }]}>
            {formatNumber(timeLeft.minutes)}
          </Text>
          <Text style={styles.unitLabel}>min</Text>
        </View>
        <Text style={[styles.colon, { color: getColor() }]}>:</Text>
        <View style={styles.unit}>
          <Text style={[styles.number, { color: getColor() }]}>
            {formatNumber(timeLeft.seconds)}
          </Text>
          <Text style={styles.unitLabel}>sec</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unit: {
    alignItems: 'center',
  },
  number: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unitLabel: {
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  colon: {
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 4,
    marginBottom: 12,
  },
});

export default CountdownTimer;
