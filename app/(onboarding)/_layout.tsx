import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  console.log('Rendering onboarding layout');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
} 