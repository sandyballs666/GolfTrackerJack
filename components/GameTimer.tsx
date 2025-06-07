import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';

interface GameTimerProps {
  startTime: Date | null;
  isActive: boolean;
}

export default function GameTimer({ startTime, isActive }: GameTimerProps) {
  const [elapsedTime, setElapsedTime] = useState('0:00');

  useEffect(() => {
    if (!startTime || !isActive) {
      setElapsedTime('0:00');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return (
    <View style={styles.container}>
      <Timer size={16} color="#3B82F6" />
      <Text style={styles.timerText}>{elapsedTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});