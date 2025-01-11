import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter, Router } from 'expo-router';
import { useState } from 'react';
import { registerUser } from './utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = async () => {
    // Basic validation
    if (!email || !password || !name || !phone) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await registerUser({
        name,
        email,
        phone,
        password
      });

      if (response.success) {
        console.log('Registration successful, storing user data...');
        await AsyncStorage.setItem('userToken', JSON.stringify({
          token: response.user.token,
          name: response.user.name,
          email: response.user.email
        }));
        router.replace('/(tabs)' as any);
      } else {
        alert(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Top Section */}
      <View style={{ padding: 24, marginTop: 60 }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ color: '#666', fontSize: 16 }}>← Back to login</Text>
        </TouchableOpacity>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: '#fff',
          marginBottom: 8
        }}>
          Create Account
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#666'
        }}>
          Join TrueCreation today
        </Text>
      </View>

      {/* Sign Up Card */}
      <View style={{
        flex: 1,
        backgroundColor: '#1A1A1A',
        marginTop: 40,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: 30,
        }}>
          Sign Up
        </Text>

        <View style={{ gap: 20 }}>
          <View>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666"
              style={{
                backgroundColor: '#000',
                padding: 15,
                borderRadius: 12,
                color: '#FFF',
                fontSize: 16,
              }}
            />
          </View>

          <View>
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
          </View>

          <View>
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
              style={{
                backgroundColor: '#000',
                padding: 15,
                borderRadius: 12,
                color: '#FFF',
                fontSize: 16,
              }}
            />
          </View>

          <View>
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
          </View>

          <View>
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#EE705D',
              padding: 15,
              borderRadius: 12,
              marginTop: 20,
            }}
            onPress={handleSignUp}
          >
            <Text style={{
              color: '#FFF',
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 'bold'
            }}>
              Create Account
            </Text>
          </TouchableOpacity>

          <Text style={{ 
            color: '#666', 
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 20 
          }}>
            Or sign up with
          </Text>

          {/* Social Login Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center',
            gap: 20
          }}>
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#000',
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image 
                source={require('../assets/images/google.png')} 
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#000',
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Image 
                source={require('../assets/images/apple.png')} 
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <Text style={{ 
            color: '#666', 
            textAlign: 'center',
            fontSize: 12,
            marginTop: 20
          }}>
            By signing up, you agree to our{' '}
            <Text style={{ color: '#EE705D' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: '#EE705D' }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}