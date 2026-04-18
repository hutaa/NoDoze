import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, Text, View, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';
import AlarmPicker, { ALARMS } from '@/components/AlarmPicker';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '@/constants/styles';

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('detect');
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState('siren');
  const [volume, setVolume] = useState(80);
  const [permission, requestPermission] = useCameraPermissions();

  const handleTabPress = (key: string) => {
    setActiveTab(key);
    if (key === 'alarm') setShowAlarmModal(true);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" color={colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <View style={styles.livePill}>
          <Text style={styles.liveText}>● LIVE</Text>
        </View>
      </View>

      {/* Camera */}
      <View style={styles.cameraWrapper}>
        <CameraView style={styles.camera} facing="front">
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <View style={styles.scanLabel}>
            <Text style={styles.scanText}>SCANNING EYES</Text>
          </View>
        </CameraView>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Eye open</Text>
          <Text style={styles.statValue}>94<Text style={styles.statPercent}>%</Text></Text>
          <Text style={styles.statUnit}>avg probability</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Blink rate</Text>
          <Text style={styles.statValue}>18</Text>
          <Text style={styles.statUnit}>blinks / min</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Alerts</Text>
          <Text style={[styles.statValue, styles.statValueAlert]}>0</Text>
          <Text style={styles.statUnit}>this session</Text>
        </View>
      </View>

      {/* Alert bar */}
      <View style={styles.alertBar}>
        <View style={styles.alertIcon}>
          <Ionicons name="warning-outline" size={14} color={colors.red} />
        </View>
        <View>
          <Text style={styles.alertTitle}>Eyes closed &gt; 2s triggers alarm</Text>
          <Text style={styles.alertSub}>
            {ALARMS.find(a => a.key === selectedAlarm)?.name ?? 'Emergency Siren'} · Vol {volume}%
          </Text>
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {[
          { key: 'detect',   icon: 'eye-outline',           label: 'detect'   },
          { key: 'log',      icon: 'document-text-outline', label: 'log'      },
          { key: 'alarm',    icon: 'alarm-outline',         label: 'alarm'    },
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

      {/* Alarm picker */}
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