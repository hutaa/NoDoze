import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Stack } from 'expo-router';

const BACKEND_URL = "https://08e4-2620-0-5301-2101-259d-9609-82f0-4f17.ngrok-free.app";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false); // Point 2 fix
  const cameraRef = useRef<CameraView>(null);

  const processFrame = async () => {
    // Check if camera is ready before attempting capture
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
        console.log("Error capturing/sending frame:", e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loop = async () => {
      if (!isMounted || !permission?.granted) return;
      await processFrame();
      setTimeout(loop, 150); // Increased slightly for stability
    };

    if (permission?.granted) {
      loop();
    }

    return () => {
      isMounted = false;
    };
  }, [permission, isCameraReady]); // Added isCameraReady dependency

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera access is required for NoDoze.</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDrowsy && styles.alertContainer]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Point 1 Fix: CameraView has no children now */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill} // Use absoluteFill to cover background
        facing="front"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Overlay is now a sibling to CameraView, positioned on top */}
      <View style={styles.overlay}>
        <Text style={styles.title}>NoDoze</Text>
        <Text style={[styles.status, isDrowsy && styles.alertText]}>
          {isDrowsy ? "DROWSY DETECTED" : "• Monitoring Active"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  alertContainer: { backgroundColor: '#ff4d4d' },
  overlay: {
    position: 'absolute', // Ensures it stays on top of the camera
    top: 60,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 1, // High zIndex to stay visible
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  status: { color: '#2ecc71', marginTop: 5, fontWeight: '600' },
  alertText: { color: '#ff4d4d' },
  errorText: { textAlign: 'center', marginBottom: 20, color: 'white' }
});