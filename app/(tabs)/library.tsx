import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function LibraryScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ padding: 24, marginTop: 60 }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: '#fff',
          marginBottom: 8
        }}>
          Your Library
        </Text>
        <Text style={{ fontSize: 16, color: '#666' }}>
          Previously analyzed tracks
        </Text>
      </View>

      <ScrollView style={{ padding: 24 }}>
        {/* Example analyzed tracks */}
        {['Guitar Solo', 'Piano Piece', 'Vocal Track'].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: '#1A1A1A',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="music-note" size={24} color="#EE705D" />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: '#FFF', fontSize: 16 }}>{item}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Analyzed 2h ago</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}