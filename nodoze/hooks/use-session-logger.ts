import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionLog = {
  date: string;
  timestamp: number;
  totalAlerts: number;
  totalFrames: number;
  drowsyFrames: number;
  avgAlertnessScore: number;
};

export function useSessionLogger(isDrowsy: boolean, isActive: boolean) {
  const totalFramesRef = useRef(0);
  const drowsyFramesRef = useRef(0);
  const totalAlertsRef = useRef(0);
  const prevDrowsyRef = useRef(false);

  // Count alerts only on transition from alert → drowsy
  useEffect(() => {
    if (isDrowsy && !prevDrowsyRef.current) {
      totalAlertsRef.current += 1;
    }
    prevDrowsyRef.current = isDrowsy;
  }, [isDrowsy]);

  const recordFrame = (drowsy: boolean) => {
    totalFramesRef.current += 1;
    if (drowsy) drowsyFramesRef.current += 1;
  };

  const saveSession = async () => {
    const total = totalFramesRef.current;
    const drowsy = drowsyFramesRef.current;
    if (total === 0) return;

    const alertness = Math.round(((total - drowsy) / total) * 100);
    const now = new Date();

    const newLog: SessionLog = {
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      totalAlerts: totalAlertsRef.current,
      totalFrames: total,
      drowsyFrames: drowsy,
      avgAlertnessScore: alertness,
    };

    try {
      const existing = await AsyncStorage.getItem('session_logs');
      const logs: SessionLog[] = existing ? JSON.parse(existing) : [];
      logs.push(newLog);
      await AsyncStorage.setItem('session_logs', JSON.stringify(logs.slice(-500)));
      console.log('Session saved:', newLog);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Save on unmount (app close / navigation away)
  useEffect(() => {
    return () => {
      saveSession();
    };
  }, []);

  return {
    recordFrame,
    saveSession,
    totalFrames: totalFramesRef,
    drowsyFrames: drowsyFramesRef,
    totalAlerts: totalAlertsRef,
  };
}