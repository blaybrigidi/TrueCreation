import { View, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useEffect } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = (SCREEN_WIDTH - 40) / 4; // 40 is the total horizontal padding

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  }, [state.index]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Animated.View 
          style={[
            styles.slider, 
            { 
              width: TAB_WIDTH,
              transform: [{ translateX: slideAnim }]
            }
          ]} 
        />
        
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const getIconName = () => {
            switch (route.name) {
              case 'analyze':
                return isFocused ? 'mic' : 'mic-outline';
              case 'library':
                return isFocused ? 'library' : 'library-outline';
              case 'explore':
                return isFocused ? 'compass' : 'compass-outline';
              case 'profile':
                return isFocused ? 'person' : 'person-outline';
              default:
                return 'help-circle-outline';
            }
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[styles.tab, { width: TAB_WIDTH }]}
              activeOpacity={0.7}
            >
              <Animated.View style={styles.iconContainer}>
                <Ionicons
                  name={getIconName()}
                  size={24}
                  color={isFocused ? '#EE705D' : '#666'}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 30,
    height: 60,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 30,
  },
  tab: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 