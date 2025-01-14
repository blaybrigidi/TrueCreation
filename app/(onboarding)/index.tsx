import Onboarding from '../components/Onboarding';
import { useEffect } from 'react';

export default function OnboardingScreen() {
  useEffect(() => {
    console.log('Onboarding screen mounted');
  }, []);

  console.log('Rendering onboarding screen');
  return <Onboarding />;
} 