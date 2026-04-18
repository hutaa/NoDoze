<<<<<<< HEAD
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000); // shows for 2 seconds
=======
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(onFinish);
    }, 5000);

>>>>>>> frontend
    return () => clearTimeout(timer);
  }, []);

  return (
<<<<<<< HEAD
    <View style={styles.container}>
      <Image
        source={require('../assets/images/NoDoze.svg')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
=======
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../assets/images/NoDoze.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </Animated.View>
>>>>>>> frontend
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '60%',
    height: '60%',
  },
});