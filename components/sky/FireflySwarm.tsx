/**
 * FireflySwarm - Coordinated firefly group patterns
 * DESIGN.md §15.3: Firefly enhancements with swarm behavior
 *
 * Features:
 * - Multiple fireflies moving together
 * - Coordinated blinking patterns
 * - Circular/wave formations
 * - Staggered timing for organic feel
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Firefly } from './Firefly';

interface FireflySwarmProps {
  /** Center X position of swarm */
  x: number;
  /** Center Y position of swarm */
  y: number;
  /** Number of fireflies in swarm */
  count?: number;
  /** Swarm pattern type */
  pattern?: 'circle' | 'wave' | 'cluster' | 'line';
  /** Swarm size (radius) */
  radius?: number;
  /** Initial delay before swarm appears */
  delay?: number;
}

export function FireflySwarm({
  x,
  y,
  count = 5,
  pattern = 'circle',
  radius = 30,
  delay = 0,
}: FireflySwarmProps) {
  const fireflies = useMemo(() => {
    const positions: { x: number; y: number; delay: number }[] = [];

    switch (pattern) {
      case 'circle':
        // Fireflies arranged in a circle
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const r = radius * (0.7 + Math.random() * 0.3); // Slight variation
          positions.push({
            x: x + Math.cos(angle) * r,
            y: y + Math.sin(angle) * r,
            delay: delay + i * 400, // Stagger blinks in sequence
          });
        }
        break;

      case 'wave':
        // Fireflies in a wave pattern
        for (let i = 0; i < count; i++) {
          const offset = (i / (count - 1)) * radius * 2 - radius;
          const waveY = Math.sin((i / (count - 1)) * Math.PI * 2) * (radius * 0.5);
          positions.push({
            x: x + offset,
            y: y + waveY,
            delay: delay + i * 300,
          });
        }
        break;

      case 'cluster':
        // Random cluster within radius
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          positions.push({
            x: x + Math.cos(angle) * r,
            y: y + Math.sin(angle) * r,
            delay: delay + Math.random() * 2000, // Random timing
          });
        }
        break;

      case 'line':
        // Fireflies in a line
        for (let i = 0; i < count; i++) {
          const offset = (i / (count - 1)) * radius * 2 - radius;
          positions.push({
            x: x + offset,
            y: y + (Math.random() - 0.5) * 10, // Slight vertical variation
            delay: delay + i * 350,
          });
        }
        break;
    }

    return positions;
  }, [x, y, count, pattern, radius, delay]);

  return (
    <>
      {fireflies.map((ff, i) => (
        <Firefly key={`ff-${i}`} x={ff.x} y={ff.y} delay={ff.delay} />
      ))}
    </>
  );
}

export default FireflySwarm;
