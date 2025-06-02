import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../../utils/api';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const userDataString = await AsyncStorage.getItem('userToken');
      console.log('User data from storage:', userDataString);
      
      if (userDataString) {
        const parsedData = JSON.parse(userDataString);
        console.log('Parsed user data:', parsedData);
        setUserData(parsedData);
      } else {
        console.log('No user data found in storage');
        // Redirect to login if no user data is found
        router.replace('/_login' as any);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Starting handleLogout...');
      const userDataString = await AsyncStorage.getItem('userToken');
      
      if (!userDataString) {
        console.log('No userToken found in AsyncStorage');
        throw new Error('No user token found');
      }

      console.log('UserToken found:', userDataString);
      const userData = JSON.parse(userDataString);
      console.log('Parsed userData:', userData);

      if (!userData.token) {
        console.log('No token in userData');
        throw new Error('No token found in user data');
      }

      console.log('Calling logoutUser with token:', userData.token);
      const response = await logoutUser(userData.token);
      console.log('Logout response:', response);

      if (response.success) {
        console.log('Logout successful, removing token...');
        await AsyncStorage.removeItem('userToken');
        console.log('Token removed, redirecting to login...');
        router.replace('/_login' as any);
      } else {
        console.log('Logout failed:', response.error);
        Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
      }
    } catch (error) {
      console.error('Logout error in component:', error);
      // Remove token and redirect anyway if there's an error
      console.log('Removing token due to error...');
      await AsyncStorage.removeItem('userToken');
      console.log('Token removed, redirecting to login...');
      router.replace('/_login' as any);
    }
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{userData.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{userData.name}</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="settings-outline" size={24} color="#FFF" />
        <Text style={styles.menuText}>Settings</Text>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FFF" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EE705D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#EE705D',
    padding: 15,
    borderRadius: 12,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
});