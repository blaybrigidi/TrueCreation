import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SearchResult } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function AnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const results: SearchResult | SearchResult[] = JSON.parse(params.results as string);

  const renderResult = (result: SearchResult) => (
    <View style={styles.resultItem}>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{result.songName}</Text>
        {result.matchRatio && (
          <Text style={styles.matchScore}>
            Match: {(result.matchRatio * 100).toFixed(1)}%
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn}
        style={styles.resultsContainer}
      >
        <Text style={styles.title}>Analysis Results</Text>
        
        <ScrollView style={styles.scrollView}>
          {Array.isArray(results) 
            ? results.map((result, index) => (
                <View key={index}>
                  {renderResult(result)}
                </View>
              ))
            : renderResult(results)
          }
        </ScrollView>

        <TouchableOpacity 
          style={styles.tryAgainButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="refresh" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Try Another</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  waveformContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(238, 112, 93, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(238, 112, 93, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 20,
  },
  resultsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: height * 0.7,
    padding: 24,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EE705D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    marginLeft: 16,
    flex: 1,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#EE705D',
    fontSize: 18,
    marginVertical: 4,
  },
  albumName: {
    color: '#666',
    fontSize: 14,
  },
  detailsScroll: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  toneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  toneInfo: {
    marginLeft: 12,
    flex: 1,
  },
  noteName: {
    color: '#FFF',
    fontSize: 16,
  },
  intensityBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 8,
    width: '100%',
  },
  intensityFill: {
    height: '100%',
    backgroundColor: '#EE705D',
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#EE705D',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchScore: {
    color: '#EE705D',
    fontSize: 14,
    marginTop: 4,
  },
}); 