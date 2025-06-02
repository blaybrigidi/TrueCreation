import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SearchResult } from '../../utils/api';
import { useState, useEffect } from 'react';

const { width, height } = Dimensions.get('window');

export default function AnalysisScreen() {
  const router = useRouter();
  const { results: resultsParam, audioUri } = useLocalSearchParams();
  
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (resultsParam && typeof resultsParam === 'string') {
      try {
        const parsedResults = JSON.parse(resultsParam);
        // Ensure we always have an array
        const resultsArray = Array.isArray(parsedResults) ? parsedResults : [parsedResults];
        setResults(resultsArray);
      } catch (error) {
        console.error('Error parsing results:', error);
        setResults([]);
      }
    }
  }, [resultsParam]);

  const renderResult = (result: SearchResult, index: number) => (
    <Animated.View 
      key={index}
      entering={SlideInDown.delay(index * 100)}
      style={[styles.resultCard, { marginBottom: 16 }]}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{result.songName}</Text>
        {result.songId && (
          <Text style={styles.songId}>ID: {result.songId}</Text>
        )}
        {result.matchRatio !== undefined && (
          <View style={styles.matchContainer}>
            <Text style={styles.matchLabel}>Match Confidence: </Text>
            <Text style={[styles.matchScore, { 
              color: result.matchRatio > 0.8 ? '#4CAF50' : 
                     result.matchRatio > 0.6 ? '#FF9800' : '#F44336' 
            }]}>
              {(result.matchRatio * 100).toFixed(1)}%
            </Text>
          </View>
        )}
        {result.timeDelta !== undefined && (
          <Text style={styles.timeDelta}>Time offset: {result.timeDelta.toFixed(2)}s</Text>
        )}
      </View>
    </Animated.View>
  );

  if (!results || results.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            We couldn't find any matching songs in our database.
          </Text>
          <TouchableOpacity 
            style={styles.tryAgainButton}
            onPress={() => router.back()}
          >
            <Text style={styles.tryAgainText}>Try Another Audio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn}
        style={styles.header}
      >
        <Text style={styles.title}>🎵 Analysis Results</Text>
        <Text style={styles.subtitle}>Found {results.length} match{results.length !== 1 ? 'es' : ''}</Text>
      </Animated.View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {results.map((result, index) => renderResult(result, index))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.tryAgainButton}
        onPress={() => router.back()}
      >
        <Text style={styles.tryAgainText}>Analyze Another Audio</Text>
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
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
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  resultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  songId: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchLabel: {
    color: '#999',
    fontSize: 14,
  },
  timeDelta: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  tryAgainButton: {
    backgroundColor: '#EE705D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    margin: 24,
  },
  tryAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 