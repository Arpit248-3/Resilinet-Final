import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screen Imports
import SOSScreen from '../../screens/SOSScreen.js'; 
import OfflineGuide from '../../screens/OfflineGuide.js';
import StatusMap from '../../screens/StatusMap.js';

// Triage is disabled to prevent the FaceDetector crash
// import HealthCheck from '../../components/HealthCheck.js';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'SOS') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
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
      {/* Triage Screen is hidden to avoid native module errors */}
      <Tab.Screen name="Guide" component={OfflineGuide} options={{ title: 'SURVIVAL GUIDE' }} />
      <Tab.Screen name="Map" component={StatusMap} options={{ title: 'SAFE ZONES' }} />
    </Tab.Navigator>
  );
}