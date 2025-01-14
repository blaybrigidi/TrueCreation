import { View, Image, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Run animations in parallel
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Check authentication status
    const checkAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        
        // Navigate after animation completes
        setTimeout(() => {
          if (userData) {
            const parsedData = JSON.parse(userData);
            if (parsedData.isFirstTimeUser) {
              router.replace('/(onboarding)' as any);
            } else {
              router.replace('/(tabs)' as any);
            }
          } else {
            router.replace('/_login' as any);
          }
        }, 2500);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/_login' as any);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    }}>
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
      }}>
        <Image 
          source={require('../assets/images/Tones_logo.png')}
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
        <Text style={{
          color: '#fff',
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          TrueCreation
        </Text>
      </Animated.View>
    </View>
  );
} 