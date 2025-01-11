import * as FileSystem from 'expo-file-system';
import config from '../config';
import { decryptData } from './crypto';

const API_URL = `${config.API_URL}/api/users`;  // Base API URL

export interface SearchResult {
  songName: string;
  matchRatio?: number;
}

interface RegisterUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginUserData {
  email: string;
  password: string;
}

export const loginUser = async (credentials: LoginUserData) => {
  try {
    console.log('Starting login...');
    console.log('API URL:', `${API_URL}/login`);
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '049c7e635ebc61027458aff460a5f86aae6efbef0ef530d8c1124840baad282d',
        'x-api-secret': '0827bf20cf7c9c10126f8216b19205d93d12fc42d4ad604610d96cad36069358'
      },
      body: JSON.stringify(credentials),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Login response data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.msg || 'Login failed'
      };
    }

    // Decrypt the response data
    try {
      const decryptedData = decryptData(data.data);
      console.log('Decrypted data:', decryptedData);

      if (!decryptedData?.token) {
        console.error('No token in decrypted response:', decryptedData);
        return {
          success: false,
          error: 'No token received'
        };
      }

      return {
        success: true,
        user: decryptedData,
        error: null
      };
    } catch (decryptError) {
      console.error('Failed to decrypt response:', decryptError);
      return {
        success: false,
        error: 'Failed to process login response'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error during login'
    };
  }
};

export const registerUser = async (userData: RegisterUserData) => {
  try {
    console.log('Starting registration...');
    console.log('API URL:', `${API_URL}/signup`);
    console.log('User data:', userData);
    
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '049c7e635ebc61027458aff460a5f86aae6efbef0ef530d8c1124840baad282d',
        'x-api-secret': '0827bf20cf7c9c10126f8216b19205d93d12fc42d4ad604610d96cad36069358'
      },
      body: JSON.stringify(userData),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.msg || 'Registration failed'
      };
    }

    // Handle encrypted response if present
    if (data.data) {
      try {
        const decryptedData = decryptData(data.data);
        return {
          success: true,
          user: decryptedData,
          error: null
        };
      } catch (decryptError) {
        console.error('Failed to decrypt response:', decryptError);
        return {
          success: false,
          error: 'Failed to process registration response'
        };
      }
    }

    return {
      success: true,
      user: data.data,
      error: null
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Network error during registration'
    };
  }
};

export const uploadAudio = async (fileUri: string) => {
  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop()!;
    
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: `audio/${filename.split('.').pop()}`
    } as any);
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.err) throw new Error(data.err);
    return data.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const searchAudio = async (fileUri: string): Promise<SearchResult | SearchResult[]> => {
  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop()!;
    
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: `audio/${filename.split('.').pop()}`
    } as any);

    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.err) throw new Error(data.err);
    
    // Handle different response formats
    if (typeof data.data === 'string') {
      return { songName: data.data };
    }
    
    return data.data.map(([name, ratio]: [string, number]) => ({
      songName: name,
      matchRatio: ratio
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const logoutUser = async (token: string) => {
  try {
    console.log('Starting logout process...');
    console.log('Token:', token);
    
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': '049c7e635ebc61027458aff460a5f86aae6efbef0ef530d8c1124840baad282d',
        'x-api-secret': '0827bf20cf7c9c10126f8216b19205d93d12fc42d4ad604610d96cad36069358'
      }
    });

    console.log('Logout response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      console.log('Response not OK');
      return {
        success: false,
        error: 'Failed to logout'
      };
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log('Empty response received');
      return {
        success: true
      };
    }

    try {
      const text = await response.text();
      console.log('Raw response text:', text);
      
      if (!text) {
        console.log('Empty response text');
        return { success: true };
      }

      const data = JSON.parse(text);
      console.log('Parsed response data:', data);
      return {
        success: true,
        data: data
      };
    } catch (parseError) {
      console.log('Failed to parse response:', parseError);
      // If JSON parsing fails, but response was OK, consider it successful
      return {
        success: true
      };
    }
  } catch (error) {
    console.error('Network error during logout:', error);
    return {
      success: false,
      error: 'Network error during logout'
    };
  }
}; 