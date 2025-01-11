import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { searchAudio, SearchResult } from '../utils/api';

export default function HomeScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const handleSelectAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });

      if (result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0].name);
        startAnalysis(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking audio file:', error);
      alert('Failed to select audio file');
    }
  };

  const startAnalysis = async (fileUri: string) => {
    setIsAnalyzing(true);
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      const result = await searchAudio(fileUri);
      router.push({
        pathname: '/analysis',
        params: { results: JSON.stringify(result) }
      });
    } catch (error) {
      alert('Analysis failed: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
      pulseAnim.setValue(1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={{ padding: 24, marginTop: 60 }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: '#fff',
          marginBottom: 8
        }}>
          Analyze Music
        </Text>
        <Text style={{ fontSize: 16, color: '#666' }}>
          Select an audio file to analyze
        </Text>
      </View>

      {/* Main Content */}
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <Animated.View style={{
          transform: [{ scale: pulseAnim }]
        }}>
          <TouchableOpacity
            onPress={handleSelectAudio}
            disabled={isAnalyzing}
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: '#EE705D',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#EE705D',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <MaterialIcons 
              name={isAnalyzing ? "graphic-eq" : "music-note"} 
              size={60} 
              color="#FFF" 
            />
            <Text style={{
              color: '#FFF',
              marginTop: 12,
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              paddingHorizontal: 20,
            }}>
              {isAnalyzing 
                ? 'Analyzing...' 
                : selectedFile 
                  ? 'Analyzing:\n' + selectedFile
                  : 'Select Audio File'
              }
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Instructions */}
        {!isAnalyzing && !selectedFile && (
          <Text style={{
            color: '#666',
            textAlign: 'center',
            marginTop: 40,
            paddingHorizontal: 40,
            lineHeight: 24,
          }}>
            Tap the button above to select an audio file. We'll analyze its tones and create a detailed breakdown.
          </Text>
        )}
      </View>
    </View>
  );
}