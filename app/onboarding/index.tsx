import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { 
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft 
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

const onboardingData = [
  {
    title: "Tone Breakdown",
    description: "Discover the detailed tone breakdown of different sounds and understand their composition",
    icon: <MaterialIcons name="graphic-eq" size={100} color="#EE705D" />
  },
  {
    title: "Sound Library",
    description: "Access a vast library of sounds and explore their unique tonal characteristics",
    icon: <MaterialIcons name="library-music" size={100} color="#EE705D" />
  },
  {
    title: "Create & Share",
    description: "Create your own sound combinations and share them with the community",
    icon: <MaterialIcons name="share" size={100} color="#EE705D" />
  }
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.View 
        entering={FadeIn}
        exiting={FadeOut}
        style={{ 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 20 
        }}
      >
        <Animated.View
          entering={SlideInRight}
          exiting={SlideOutLeft}
          style={{
            width: width * 0.6,
            height: width * 0.6,
            marginBottom: 40,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {onboardingData[currentIndex].icon}
        </Animated.View>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 16,
          textAlign: 'center'
        }}>
          {onboardingData[currentIndex].title}
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#666',
          textAlign: 'center',
          marginBottom: 40,
          paddingHorizontal: 20
        }}>
          {onboardingData[currentIndex].description}
        </Text>

        {/* Progress Dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#EE705D' : '#333'
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#EE705D',
            paddingHorizontal: 40,
            paddingVertical: 15,
            borderRadius: 12,
            width: '100%'
          }}
          onPress={handleNext}
        >
          <Text style={{
            color: '#FFF',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 'bold'
          }}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
} 