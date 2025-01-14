import { Tabs } from 'expo-router';
import CustomTabBar from '../components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }
      }}
      tabBar={props => <CustomTabBar {...props} />}
      initialRouteName="analyze"
    >
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze',
          href: null
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          href: null
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          href: null
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null
        }}
      />
    </Tabs>
  );
}