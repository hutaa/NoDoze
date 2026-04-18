import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Button, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';
import AlarmPicker, { ALARMS } from '@/components/AlarmPicker';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '@/constants/styles';

const BACKEND_URL = "https://08e4-2620-0-5301-2101-259d-9609-82f0-4f17.ngrok-free.app";

export default function HomeScreen() {
  // --- UI State ---
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('detect');
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState('siren');
  const [volume, setVolume] = useState(80);

  // --- Logic State ---
  const [permission, requestPermission] = useCameraPermissions();
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // --- Detection Logic ---
  const processFrame = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1,
          base64: true,
          skipProcessing: true,
          shutterSound: false,
        });

        if (photo?.base64) {
          const response = await fetch(`${BACKEND_URL}/detect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ image: photo.base64 }),
          });

          const data = await response.json();
          setIsDrowsy(data.isDrowsy);
        }
      } catch (e) {
        console.log("Detection Loop Error:", e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loop = async () => {
      if (!isMounted || !permission?.granted || showSplash) return;
      await processFrame();
      setTimeout(loop, 200); // Breathe time between requests
    };

    if (permission?.granted && isCameraReady && !showSplash) {
      loop();
    }
    return () => { isMounted = false; };
  }, [permission, isCameraReady, showSplash]);

  // --- Handlers ---
  const handleTabPress = (key: string) => {
    setActiveTab(key);
    if (key === 'alarm') setShowAlarmModal(true);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" color={colors.red} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDrowsy && { backgroundColor: '#4a0000' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoDot}>
          <Ionicons name="eye-outline" size={18} color="white" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>NoDoze</Text>
          <Text style={styles.headerSub}>Driver safety · Real-time</Text>
        </View>
        <View style={[styles.livePill, isDrowsy && { backgroundColor: colors.red }]}>
          <Text style={styles.liveText}>{isDrowsy ? "● ALERT" : "● LIVE"}</Text>
        </View>
      </View>

      {/* Camera Wrapper */}
      <View style={[styles.cameraWrapper, isDrowsy && { borderColor: colors.red, borderWidth: 2 }]}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={() => setIsCameraReady(true)}
        />
        {/* Absolute UI Overlay for the Camera */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.corner, styles.cornerTL, isDrowsy && { borderColor: colors.red }]} />
          <View style={[styles.corner, styles.cornerTR, isDrowsy && { borderColor: colors.red }]} />
          <View style={[styles.corner, styles.cornerBL, isDrowsy && { borderColor: colors.red }]} />
          <View style={[styles.corner, styles.cornerBR, isDrowsy && { borderColor: colors.red }]} />
          <View style={styles.scanLabel}>
            <Text style={[styles.scanText, isDrowsy && { color: colors.red }]}>
              {isDrowsy ? "DROWSINESS DETECTED" : "SCANNING EYES"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, isDrowsy && { color: colors.red }]}>
            {isDrowsy ? "LOW" : "HIGH"}
          </Text>
          <Text style={styles.statUnit}>alertness level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Blink rate</Text>
          <Text style={styles.statValue}>18</Text>
          <Text style={styles.statUnit}>blinks / min</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Alerts</Text>
          <Text style={[styles.statValue, isDrowsy && styles.statValueAlert]}>
            {isDrowsy ? "1" : "0"}
          </Text>
          <Text style={styles.statUnit}>this session</Text>
        </View>
      </View>

      {/* Alert bar */}
      <View style={[styles.alertBar, isDrowsy && { backgroundColor: 'rgba(255, 77, 77, 0.1)' }]}>
        <View style={styles.alertIcon}>
          <Ionicons name="warning-outline" size={14} color={colors.red} />
        </View>
        <View>
          <Text style={styles.alertTitle}>Critical Detection Mode</Text>
          <Text style={styles.alertSub}>
            {ALARMS.find(a => a.key === selectedAlarm)?.name ?? 'Emergency Siren'} · Vol {volume}%
          </Text>
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {[
          { key: 'detect', icon: 'eye-outline', label: 'detect' },
          { key: 'log', icon: 'document-text-outline', label: 'log' },
          { key: 'alarm', icon: 'alarm-outline', label: 'alarm' },
        ].map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.navBtn, activeTab === key && styles.navBtnActive]}
            onPress={() => handleTabPress(key)}
          >
            <Ionicons
              name={icon as any}
              size={22}
              color={activeTab === key ? colors.red : colors.muted}
            />
            <Text style={[styles.navLabel, activeTab === key && styles.navLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AlarmPicker
        visible={showAlarmModal}
        selectedAlarm={selectedAlarm}
        volume={volume}
        onSelectAlarm={setSelectedAlarm}
        onVolumeChange={setVolume}
        onClose={() => setShowAlarmModal(false)}
      />
    </View>
  );
}