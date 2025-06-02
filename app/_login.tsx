import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { loginUser } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await loginUser({ email, password });
      
      if (response.success) {
        console.log('Login successful, storing token...');
        await AsyncStorage.setItem('userToken', JSON.stringify({
          token: response.user.token,
          name: response.user.name,
          email: response.user.email
        }));
        router.replace('/(tabs)' as any);
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Top Section */}
      <View style={{ padding: 24, marginTop: 60 }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: '#fff',
          marginBottom: 8
        }}>
          Hello!
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#666'
        }}>
          Welcome to TrueCreation
        </Text>
      </View>

      {/* Login Card */}
      <View style={{
        flex: 1,
        backgroundColor: '#1A1A1A',
        marginTop: 40,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
      }}>
        <View style={{ gap: 20 }}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor="#666"
            style={{
              backgroundColor: '#000',
              padding: 15,
              borderRadius: 12,
              color: '#FFF',
              fontSize: 16,
            }}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#666"
            style={{
              backgroundColor: '#000',
              padding: 15,
              borderRadius: 12,
              color: '#FFF',
              fontSize: 16,
            }}
          />

          <TouchableOpacity
            style={{
              backgroundColor: '#EE705D',
              padding: 15,
              borderRadius: 12,
              marginTop: 20,
            }}
            onPress={handleLogin}
          >
            <Text style={{
              color: '#FFF',
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 'bold'
            }}>
              Login
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center',
            marginTop: 20,
            gap: 5
          }}>
            <Text style={{ color: '#666' }}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/_signup')}>
              <Text style={{ color: '#EE705D', fontWeight: 'bold' }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}