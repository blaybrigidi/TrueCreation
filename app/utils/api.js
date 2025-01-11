import * as FileSystem from 'expo-file-system';

const API_URL = 'http://your-server-ip:8000';  // Replace with your server IP

export const uploadAudio = async (fileUri) => {
  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    
    // Create file object from URI
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: `audio/${filename.split('.').pop()}`
    });
    formData.append('filename', filename);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.err) {
      throw new Error(data.err);
    }
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const searchAudio = async (fileUri) => {
  try {
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: `audio/${filename.split('.').pop()}`
    });
    formData.append('filename', filename);

    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.err) {
      throw new Error(data.err);
    }
    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};