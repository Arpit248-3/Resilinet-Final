import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// GOING UP 2 LEVELS
// 1. Out of (tabs)
// 2. Out of app
import SOSScreen from '../../screens/SOSScreen.js'; 
import OfflineGuide from '../../screens/OfflineGuide.js';
import StatusMap from '../../screens/StatusMap.js';

// This one is in the 'components' folder, not 'screens'
import HealthCheck from '../../components/HealthCheck.js';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    // independent={true} is required because Expo Router usually handles navigation
    <NavigationContainer independent={true}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'SOS') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
            else if (route.name === 'Triage') iconName = focused ? 'camera' : 'camera-outline';
            else if (route.name === 'Guide') iconName = focused ? 'book' : 'book-outline';
            else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#e63946',
          tabBarInactiveTintColor: 'gray',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: 'bold', color: '#e63946' },
        })}
      >
        <Tab.Screen name="SOS" component={SOSScreen} options={{ title: 'EMERGENCY' }} />
        <Tab.Screen name="Triage" component={HealthCheck} options={{ title: 'BIOMETRIC SCAN' }} />
        <Tab.Screen name="Guide" component={OfflineGuide} options={{ title: 'SURVIVAL GUIDE' }} />
        <Tab.Screen name="Map" component={StatusMap} options={{ title: 'SAFE ZONES' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}