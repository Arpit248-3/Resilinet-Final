import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e63946',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10,
          backgroundColor: '#000',
          borderTopWidth: 1,
          borderTopColor: '#222',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "alert-circle" : "alert-circle-outline"} size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="guide"
        options={{
          title: 'GUIDES',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'RESOURCES',
          tabBarBadge: '!',
          tabBarBadgeStyle: { 
            backgroundColor: '#e63946', 
            color: '#fff',
            fontSize: 10,
            lineHeight: 15,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "call" : "call-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}