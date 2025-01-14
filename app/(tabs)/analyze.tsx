import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeFile, analyzeRecording, AnalysisResult } from '../utils/api';

export default function AnalyzeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const recording = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (isRecording) {
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
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
  };

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      setIsRecording(true);
      startPulseAnimation();
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecording() {
    try {
      if (!recording.current) return;
      
      setIsRecording(false);
      await recording.current.stopAndUnloadAsync();
      await handleRecordingComplete();
      recording.current = null;
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }

  const handleRecordingComplete = async () => {
    try {
      setIsLoading(true);
      if (!recording.current) {
        Alert.alert('Error', 'No recording found');
        return;
      }
      
      const uri = await recording.current.getURI();
      if (!uri) {
        Alert.alert('Error', 'Failed to get recording URI');
        return;
      }

      const token = await AsyncStorage.getItem('userData');
      if (!token) {
        Alert.alert('Error', 'Not logged in');
        return;
      }

      const result = await analyzeRecording(uri, token);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing recording:', error);
      Alert.alert('Error', 'Failed to analyze recording');
    } finally {
      setIsLoading(false);
    }
  };

  async function handleFileUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsLoading(true);
        setAnalysisResult(null);

        const userDataString = await AsyncStorage.getItem('userData');
        if (!userDataString) {
          throw new Error('No user data found');
        }
        const userData = JSON.parse(userDataString);
        const analysisResult = await analyzeFile(file.uri, userData.token);
        setAnalysisResult(analysisResult);
      }
    } catch (error) {
      console.error('Failed to analyze file:', error);
      // Show error to user
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.recordButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.button, isRecording ? styles.recording : null]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={40}
            color="white"
          />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        onPress={handleFileUpload}
        style={styles.uploadButton}
        activeOpacity={0.7}
        disabled={isRecording || isLoading}
      >
        <Ionicons name="cloud-upload" size={24} color="white" />
        <Text style={styles.uploadText}>Upload Audio File</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing audio...</Text>
        </View>
      )}

      {analysisResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Results:</Text>
          <Text style={styles.resultText}>Tempo: {analysisResult.tempo} BPM</Text>
          <Text style={styles.resultText}>Key: {analysisResult.key}</Text>
          <Text style={styles.resultText}>Time Signature: {analysisResult.timeSignature}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  recordButton: {
    marginBottom: 30,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recording: {
    backgroundColor: '#FF3B30',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#32CD32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 20,
  },
  uploadText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    width: '100%',
  },
  resultTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    color: 'white',
    fontSize: 16,
    marginVertical: 5,
  },
}); 