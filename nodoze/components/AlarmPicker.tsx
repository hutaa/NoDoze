import { View, Text, TouchableOpacity, Modal, ScrollView, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '@/constants/styles';
import { Audio } from 'expo-av';
import { useState, useRef } from 'react';

const SOUNDS: Record<string, any> = {
  siren:  require('../assets/sounds/siren.mp3'),
  beep:   require('../assets/sounds/beep.mp3'),
  horn:   require('../assets/sounds/horn.mp3'),
  buzzer: require('../assets/sounds/buzzer.mp3'),
  voice:  require('../assets/sounds/voice.mp3'),
  reveille:  require('../assets/sounds/reveille.mp3'),
};

export const ALARMS = [
  { key: 'siren',   name: 'Emergency Siren', desc: 'Loud, sharp — impossible to sleep through', icon: 'megaphone-outline' },
  { key: 'beep',    name: 'Rapid Beep',      desc: 'Fast repeating beep pattern',               icon: 'radio-outline' },
  { key: 'horn',    name: 'Car Horn',         desc: 'Realistic horn blast',                      icon: 'car-outline' },
  { key: 'buzzer',  name: 'Buzzer',           desc: 'Classic alarm buzzer',                      icon: 'notifications-outline' },
  { key: 'voice',   name: 'Faaa',      desc: '"Faaaa"',        icon: 'mic-outline' },
  { key: 'reveille',   name: 'Reveille',      desc: '"Military call"',        icon: 'mic-outline' },
  { key: 'vibrate', name: 'Vibrate Only',     desc: 'Silent — vibration pattern only',           icon: 'phone-portrait-outline' },
];

type Props = {
  visible: boolean;
  selectedAlarm: string;
  volume: number;
  onSelectAlarm: (key: string) => void;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
};

export default function AlarmPicker({
  visible,
  selectedAlarm,
  volume,
  onSelectAlarm,
  onVolumeChange,
  onClose,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const loopingRef = useRef(false);

  const stopAlarm = async () => {
    loopingRef.current = false;
    Vibration.cancel();
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  const playLoop = async () => {
    if (!loopingRef.current) return;

    try {
      const { sound } = await Audio.Sound.createAsync(SOUNDS[selectedAlarm]);
      soundRef.current = sound;
      await sound.setVolumeAsync(volume / 100);
      await sound.playAsync();

      // when clip finishes, play again if still looping
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && loopingRef.current) {
          sound.unloadAsync().then(() => playLoop());
        }
      });
    } catch (e) {
      console.error('Sound error:', e);
    }
  };

  const handleTest = async () => {
    if (isPlaying) {
      await stopAlarm();
      return;
    }

    setIsPlaying(true);
    loopingRef.current = true;

    if (selectedAlarm === 'vibrate') {
      Vibration.vibrate([500, 300, 500, 300, 500], true); // true = repeat
      return;
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await playLoop();
  };

  // stop alarm if modal closes
  const handleClose = async () => {
    await stopAlarm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Alarm Sound</Text>
          <Text style={styles.modalSub}>Choose what plays when drowsiness is detected</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {ALARMS.map((alarm) => {
              const isActive = selectedAlarm === alarm.key;
              return (
                <TouchableOpacity
                  key={alarm.key}
                  style={[styles.alarmCard, isActive && styles.alarmCardActive]}
                  onPress={() => onSelectAlarm(alarm.key)}
                >
                  <View style={[styles.alarmIconBox, isActive && styles.alarmIconBoxActive]}>
                    <Ionicons
                      name={alarm.icon as any}
                      size={20}
                      color={isActive ? colors.red : colors.muted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alarmName, isActive && styles.alarmNameActive]}>
                      {alarm.name}
                    </Text>
                    <Text style={styles.alarmDesc}>{alarm.desc}</Text>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.red}
                      style={styles.alarmCheck}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Volume */}
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Vol {volume}%</Text>
              <View style={styles.volumeTrack}>
                <View style={[styles.volumeFill, { width: `${volume}%` }]} />
              </View>
              <TouchableOpacity onPress={() => onVolumeChange(Math.max(0, volume - 10))}>
                <Ionicons name="remove-circle-outline" size={24} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onVolumeChange(Math.min(100, volume + 10))}>
                <Ionicons name="add-circle-outline" size={24} color={colors.red} />
              </TouchableOpacity>
            </View>

            {/* Test / Stop button */}
            <TouchableOpacity
              style={[styles.testBtn, isPlaying && styles.testBtnStop]}
              onPress={handleTest}
            >
              <Text style={styles.testBtnText}>
                {isPlaying ? '■ Stop Alarm' : '▶ Test Alarm'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}