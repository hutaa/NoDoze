// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { useState, useEffect, useRef } from 'react';
// import { Button, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
// import { Stack } from 'expo-router';
// import SplashScreen from '@/components/SplashScreen';
// import AlarmPicker, { ALARMS } from '@/components/AlarmPicker';
// import { Ionicons } from '@expo/vector-icons';
// import { styles, colors } from '@/constants/styles';
// import { Audio } from 'expo-av';
// import { Vibration } from 'react-native';

// const SOUNDS: Record<string, any> = {
//   siren: require('../assets/sounds/siren.mp3'),
//   beep: require('../assets/sounds/beep.mp3'),
//   horn: require('../assets/sounds/horn.mp3'),
//   buzzer: require('../assets/sounds/buzzer.mp3'),
//   voice: require('../assets/sounds/voice.mp3'),
//   reveille: require('../assets/sounds/reveille.mp3'),
// };

// const BACKEND_URL = "https://d384-2620-0-5301-2101-997c-fdfb-9599-7a0e.ngrok-free.app";

// export default function HomeScreen() {
//   // --- UI State ---
//   const [showSplash, setShowSplash] = useState(true);
//   const [activeTab, setActiveTab] = useState('detect');
//   const [showAlarmModal, setShowAlarmModal] = useState(false);
//   const [selectedAlarm, setSelectedAlarm] = useState('siren');
//   const [volume, setVolume] = useState(100);

//   // --- Logic State ---
//   const [permission, requestPermission] = useCameraPermissions();
//   const [isDrowsy, setIsDrowsy] = useState(false);
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const cameraRef = useRef<CameraView>(null);

//   // --- Alarm refs ---
//   const alarmSoundRef = useRef<Audio.Sound | null>(null);
//   const alarmLoopingRef = useRef(false);

//   const stopAlarm = async () => {
//     alarmLoopingRef.current = false;
//     Vibration.cancel();
//     if (alarmSoundRef.current) {
//       await alarmSoundRef.current.stopAsync();
//       await alarmSoundRef.current.unloadAsync();
//       alarmSoundRef.current = null;
//     }
//   };

//   const playAlarmLoop = async (alarmKey: string, vol: number) => {
//     if (!alarmLoopingRef.current) return;
//     try {
//       const { sound } = await Audio.Sound.createAsync(SOUNDS[alarmKey]);
//       alarmSoundRef.current = sound;
//       await sound.setVolumeAsync(Math.min(vol / 100 * 1.5, 1)); // boost volume by 50%
//       await sound.playAsync();
//       sound.setOnPlaybackStatusUpdate((status: any) => {
//         if (status.isLoaded && status.didJustFinish && alarmLoopingRef.current) {
//           sound.unloadAsync().then(() => playAlarmLoop(alarmKey, vol));
//         }
//       });
//     } catch (e) {
//       console.error('Alarm error:', e);
//     }
//   };

//   // --- Auto-trigger alarm when drowsy ---
//   useEffect(() => {
//     if (isDrowsy) {
//       alarmLoopingRef.current = true;
//       if (selectedAlarm === 'vibrate') {
//         Vibration.vibrate([500, 300, 500, 300, 500], true);
//       } else {
//         Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).then(() =>
//           playAlarmLoop(selectedAlarm, volume)
//         );
//       }
//     } else {
//       stopAlarm();
//     }
//   }, [isDrowsy]);

//   // --- Detection Logic ---
//   const processFrame = async () => {
//     if (cameraRef.current && isCameraReady) {
//       try {
//         const photo = await cameraRef.current.takePictureAsync({
//           quality: 0.1,
//           base64: true,
//           skipProcessing: true,
//           shutterSound: false,
//         });

//         if (photo?.base64) {
//           const response = await fetch(`${BACKEND_URL}/detect`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'ngrok-skip-browser-warning': 'true'
//             },
//             body: JSON.stringify({ image: photo.base64 }),
//           });

//           const data = await response.json();
//           setIsDrowsy(data.isDrowsy);
//         }
//       } catch (e) {
//         console.log("Detection Loop Error:", e);
//       }
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;
//     const loop = async () => {
//       if (!isMounted || !permission?.granted || showSplash) return;
//       await processFrame();
//       setTimeout(loop, 200);
//     };

//     if (permission?.granted && isCameraReady && !showSplash) {
//       loop();
//     }
//     return () => { isMounted = false; };
//   }, [permission, isCameraReady, showSplash]);

//   // --- Handlers ---
//   const handleTabPress = (key: string) => {
//     setActiveTab(key);
//     if (key === 'alarm') setShowAlarmModal(true);
//   };

//   if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
//   if (!permission) return <View style={styles.container} />;
//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.permissionText}>We need your permission to show the camera</Text>
//         <Button onPress={requestPermission} title="grant permission" color={colors.red} />
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.container, isDrowsy && { backgroundColor: '#4a0000' }]}>
//       <Stack.Screen options={{ headerShown: false }} />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.logoDot}>
//           <Ionicons name="eye-outline" size={18} color="white" />
//         </View>
//         <View style={styles.headerText}>
//           <Text style={styles.headerTitle}>NoDoze</Text>
//           <Text style={styles.headerSub}>Driver safety · Real-time</Text>
//         </View>
//         <View style={[styles.livePill, isDrowsy && { backgroundColor: colors.red }]}>
//           <Text style={styles.liveText}>{isDrowsy ? "● ALERT" : "● LIVE"}</Text>
//         </View>
//       </View>

//       {/* Camera Wrapper */}
//       <View style={[styles.cameraWrapper, isDrowsy && { borderColor: colors.red, borderWidth: 2 }]}>
//         <CameraView
//           ref={cameraRef}
//           style={styles.camera}
//           facing="front"
//           onCameraReady={() => setIsCameraReady(true)}
//         />
//         <View style={StyleSheet.absoluteFill} pointerEvents="none">
//           <View style={[styles.corner, styles.cornerTL, isDrowsy && { borderColor: colors.red }]} />
//           <View style={[styles.corner, styles.cornerTR, isDrowsy && { borderColor: colors.red }]} />
//           <View style={[styles.corner, styles.cornerBL, isDrowsy && { borderColor: colors.red }]} />
//           <View style={[styles.corner, styles.cornerBR, isDrowsy && { borderColor: colors.red }]} />
//           <View style={styles.scanLabel}>
//             <Text style={[styles.scanText, isDrowsy && { color: colors.red }]}>
//               {isDrowsy ? "DROWSINESS DETECTED" : "SCANNING EYES"}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Stats row */}
//       <View style={styles.statsRow}>
//         <View style={styles.statCard}>
//           <Text style={styles.statLabel}>Status</Text>
//           <Text style={[styles.statValue, isDrowsy && { color: colors.red }]}>
//             {isDrowsy ? "LOW" : "HIGH"}
//           </Text>
//           <Text style={styles.statUnit}>alertness level</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={styles.statLabel}>Blink rate</Text>
//           <Text style={styles.statValue}>18</Text>
//           <Text style={styles.statUnit}>blinks / min</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Text style={styles.statLabel}>Alerts</Text>
//           <Text style={[styles.statValue, isDrowsy && styles.statValueAlert]}>
//             {isDrowsy ? "1" : "0"}
//           </Text>
//           <Text style={styles.statUnit}>this session</Text>
//         </View>
//       </View>

//       {/* Alert bar */}
//       <View style={[styles.alertBar, isDrowsy && { backgroundColor: 'rgba(255, 77, 77, 0.1)' }]}>
//         <View style={styles.alertIcon}>
//           <Ionicons name="warning-outline" size={14} color={colors.red} />
//         </View>
//         <View>
//           <Text style={styles.alertTitle}>Critical Detection Mode</Text>
//           <Text style={styles.alertSub}>
//             {ALARMS.find(a => a.key === selectedAlarm)?.name ?? 'Emergency Siren'} · Vol {volume}%
//           </Text>
//         </View>
//       </View>

//       {/* Bottom nav */}
//       <View style={styles.bottomNav}>
//         {[
//           { key: 'detect', icon: 'eye-outline', label: 'detect' },
//           { key: 'log', icon: 'document-text-outline', label: 'log' },
//           { key: 'alarm', icon: 'alarm-outline', label: 'alarm' },
//         ].map(({ key, icon, label }) => (
//           <TouchableOpacity
//             key={key}
//             style={[styles.navBtn, activeTab === key && styles.navBtnActive]}
//             onPress={() => handleTabPress(key)}
//           >
//             <Ionicons
//               name={icon as any}
//               size={22}
//               color={activeTab === key ? colors.red : colors.muted}
//             />
//             <Text style={[styles.navLabel, activeTab === key && styles.navLabelActive]}>
//               {label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <AlarmPicker
//         visible={showAlarmModal}
//         selectedAlarm={selectedAlarm}
//         volume={volume}
//         onSelectAlarm={setSelectedAlarm}
//         onVolumeChange={setVolume}
//         onClose={() => setShowAlarmModal(false)}
//       />
//     </View>
//   );
// }

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Button, Text, View, TouchableOpacity, StyleSheet, Vibration, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';
import AlarmPicker, { ALARMS } from '@/components/AlarmPicker';
import LogScreen from '@/components/LogScreen';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '@/constants/styles';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUNDS: Record<string, any> = {
  siren:    require('../assets/sounds/siren.mp3'),
  beep:     require('../assets/sounds/beep.mp3'),
  horn:     require('../assets/sounds/horn.mp3'),
  buzzer:   require('../assets/sounds/buzzer.mp3'),
  voice:    require('../assets/sounds/voice.mp3'),
  reveille: require('../assets/sounds/reveille.mp3'),
};

const BACKEND_URL = "https://d384-2620-0-5301-2101-997c-fdfb-9599-7a0e.ngrok-free.app";

export type SessionLog = {
  date: string;        // "2024-04-18"
  timestamp: number;
  totalAlerts: number;
  totalFrames: number;
  drowsyFrames: number;
  avgAlertnessScore: number; // 0-100
};

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('detect');
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState('siren');
  const [volume, setVolume] = useState(100);

  const [permission, requestPermission] = useCameraPermissions();
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Session tracking
  const totalFramesRef = useRef(0);
  const drowsyFramesRef = useRef(0);
  const totalAlertsRef = useRef(0);
  const sessionStartRef = useRef<number>(Date.now());

  // Alarm refs
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const alarmLoopingRef = useRef(false);

  const stopAlarm = async () => {
    alarmLoopingRef.current = false;
    Vibration.cancel();
    if (alarmSoundRef.current) {
      await alarmSoundRef.current.stopAsync();
      await alarmSoundRef.current.unloadAsync();
      alarmSoundRef.current = null;
    }
  };

  const playAlarmLoop = async (alarmKey: string) => {
    if (!alarmLoopingRef.current) return;
    try {
      const { sound } = await Audio.Sound.createAsync(SOUNDS[alarmKey]);
      alarmSoundRef.current = sound;
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish && alarmLoopingRef.current) {
          sound.unloadAsync().then(() => playAlarmLoop(alarmKey));
        }
      });
    } catch (e) {
      console.error('Alarm error:', e);
    }
  };

  useEffect(() => {
    if (isDrowsy) {
      totalAlertsRef.current += 1;
      alarmLoopingRef.current = true;
      if (selectedAlarm === 'vibrate') {
        Vibration.vibrate([500, 300, 500, 300, 500], true);
      } else {
        Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        }).then(() => playAlarmLoop(selectedAlarm));
      }
    } else {
      stopAlarm();
    }
  }, [isDrowsy]);

  // Save session log to AsyncStorage
  const saveSession = async () => {
    const total = totalFramesRef.current;
    const drowsy = drowsyFramesRef.current;
    if (total === 0) return;

    const alertness = Math.round(((total - drowsy) / total) * 100);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    const newLog: SessionLog = {
      date: dateKey,
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
      // Keep last 90 days of logs
      const trimmed = logs.slice(-500);
      await AsyncStorage.setItem('session_logs', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

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
          totalFramesRef.current += 1;

          const response = await fetch(`${BACKEND_URL}/detect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ image: photo.base64 }),
          });

          const data = await response.json();
          if (data.isDrowsy) drowsyFramesRef.current += 1;
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
      setTimeout(loop, 200);
    };

    if (permission?.granted && isCameraReady && !showSplash) {
      sessionStartRef.current = Date.now();
      loop();
    }

    return () => {
      isMounted = false;
      saveSession(); // save when component unmounts
    };
  }, [permission, isCameraReady, showSplash]);

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

      {/* Log Tab */}
      {activeTab === 'log' ? (
        <LogScreen />
      ) : (
        <>
          {/* Camera Wrapper — slightly taller */}
          <View style={[
            styles.cameraWrapper,
            { flex: 0, height: '52%' }, // increased from default
            isDrowsy && { borderColor: colors.red, borderWidth: 2 }
          ]}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={() => setIsCameraReady(true)}
            />
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
              <Text style={styles.statLabel}>Alertness</Text>
              <Text style={styles.statValue}>
                {totalFramesRef.current === 0 ? '—' :
                  `${Math.round(((totalFramesRef.current - drowsyFramesRef.current) / totalFramesRef.current) * 100)}%`}
              </Text>
              <Text style={styles.statUnit}>this session</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Alerts</Text>
              <Text style={[styles.statValue, isDrowsy && styles.statValueAlert]}>
                {totalAlertsRef.current}
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
        </>
      )}

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