import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { registerUser } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [callingCode, setCallingCode] = useState('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  };

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
      const fullPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
      const response = await registerUser({
        name,
        email,
        phone: fullPhone,
        password
      });

      if (response.success) {
        await AsyncStorage.setItem('userData', JSON.stringify({
          ...response.user,
          isFirstTimeUser: true
        }));
        console.log('Redirecting to onboarding...');
        try {
          await router.replace('/(onboarding)' as any);
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback navigation
          router.replace('/onboarding/index' as any);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Top Section */}
      <View style={{ padding: 24, marginTop: 60 }}>
        <TouchableOpacity 
          onPress={() => router.push('/_login' as any)}
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

          {/* Phone Input Section */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#000',
            borderRadius: 12,
            alignItems: 'center',
            height: 50, // Fixed height
          }}>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 15,
                height: '100%',
                borderRightWidth: 1,
                borderRightColor: '#333',
              }}
            >
              <CountryPicker
                withFilter={true}
                withFlag={true}
                withCallingCode={true}
                withEmoji={false}
                withModal={true}
                withFlagButton={true}
                withCloseButton={true}
                onSelect={onSelectCountry}
                countryCode={countryCode || 'US'}
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                containerButtonStyle={{
                  alignItems: 'center',
                }}
                theme={{
                  backgroundColor: '#1A1A1A',
                  primaryColor: '#EE705D',
                  primaryColorVariant: '#EE705D',
                  fontSize: 16,
                  fontFamily: undefined,
                  filterPlaceholderTextColor: '#666',
                  activeOpacity: 0.7,
                  itemHeight: 50,
                  onBackgroundTextColor: '#FFF'
                }}
                modalProps={{
                  animationType: "slide"
                }}
              />
              <Text style={{ 
                color: '#FFF', 
                fontSize: 16, 
                marginLeft: 8 
              }}>+{callingCode}</Text>
            </TouchableOpacity>
            
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
              style={{
                flex: 1,
                height: '100%',
                paddingHorizontal: 15,
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
        </View>
      </View>
    </View>
  );
} 