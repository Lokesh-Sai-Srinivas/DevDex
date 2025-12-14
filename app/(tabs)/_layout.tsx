import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar'; // Import the library
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';


// --- CUSTOM ANIMATED ICON COMPONENT ---
// This handles the smooth "Ease In Out" motion you asked for
const TabIcon = ({ name, color, focused }: { name: any; color: string; focused: boolean }) => {
  // 1. Create animated values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  // 2. Run animation when "focused" changes
  useEffect(() => {
    const toValue = focused ? 1 : 0;

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue,
        duration: 300, // Slower, smoother duration
        easing: Easing.out(Easing.back(1.5)), // "Bouncy" Ease Out effect
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  // 3. Interpolate values (Map 0-1 to actual pixels/sizes)
  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25] // Grow 25% larger
  });

  const translateY = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8] // Move up 8 pixels
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync("#121212");
      NavigationBar.setButtonStyleAsync("light"); // Makes the buttons (Back/Home) white
    }
  }, []);

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale }, { translateY }] }}>
      <Ionicons name={name} size={26} color={color} />
      {/* Subtle Dot Indicator */}
      <Animated.View 
        style={{ 
           opacity: scaleAnim, // Fade in the dot
           width: 5, height: 5, borderRadius: 3, 
           backgroundColor: color, marginTop: 4 
        }} 
      />
    </Animated.View>
    
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70, // Balanced height
          paddingBottom: Platform.OS === 'ios' ? 25 : 80,
          paddingTop: 17,
          elevation: 0, // Remove Android shadow for a flat look
        },
        tabBarShowLabel: false, // Clean look, no text
        tabBarActiveTintColor: '#4db8ff', // Brand Blue
        tabBarInactiveTintColor: '#666',  // Dim Gray
      }}
    >
      {/* Left: Favorites */}
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "heart" : "heart-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* Middle: Home (Now Uniform) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "grid" : "grid-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* Right: Daily */}
      <Tabs.Screen
        name="daily"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "flame" : "flame-outline"} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}