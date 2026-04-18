// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { useState } from 'react';
// import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Stack } from 'expo-router';

// export default function HomeScreen() {
//   const [permission, requestPermission] = useCameraPermissions();

//   if (!permission) {
//     // Camera permissions are still loading.
//     return <View />;
//   }

//   if (!permission.granted) {
//     // Camera permissions are not granted yet.
//     return (
//       <View style={styles.container}>
//         <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
//         <Button onPress={requestPermission} title="grant permission" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Stack.Screen options={{ headerShown: false }} />

//       <CameraView style={styles.camera} facing="front">
//         <View style={styles.overlay}>
//           <Text style={styles.title}>NoDoze</Text>
//           <Text style={styles.status}>• Monitoring Active (Lite)</Text>
//         </View>
//       </CameraView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   camera: {
//     flex: 1,
//   },
//   overlay: {
//     marginTop: 60,
//     marginHorizontal: 20,
//     padding: 20,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 20,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   status: {
//     color: '#2ecc71',
//     marginTop: 5,
//     fontWeight: '600',
//   },
// });

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView style={styles.camera} facing="front">
        <View style={styles.overlay}>
          <Text style={styles.title}>NoDoze</Text>
          <Text style={styles.status}>• Monitoring Active (Lite)</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    marginTop: 60,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  status: {
    color: '#2ecc71',
    marginTop: 5,
    fontWeight: '600',
  },
});