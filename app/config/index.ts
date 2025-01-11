import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_URL: 'http://192.168.100.11:321',
  },
  prod: {
    API_URL: process.env.API_URL || 'https://api.truecreation.com', // Replace with your production URL
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars(); 