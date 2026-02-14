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
        <Text style={[styles.number, { color: COLORS.urgent }]}>Expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        {timeLeft.hours > 0 && (
          <>
            <Text style={[styles.number, { color: getColor() }]}>
              {formatNumber(timeLeft.hours)}
            </Text>
            <Text style={[styles.colon, { color: getColor() }]}>:</Text>
          </>
        )}
        <Text style={[styles.number, { color: getColor() }]}>
          {formatNumber(timeLeft.minutes)}
        </Text>
        <Text style={[styles.colon, { color: getColor() }]}>:</Text>
        <Text style={[styles.number, { color: getColor() }]}>
          {formatNumber(timeLeft.seconds)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 0,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 2,
  },
});

export default CountdownTimer;
