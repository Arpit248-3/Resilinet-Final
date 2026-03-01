import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Network from 'expo-network';

const SOS_TARGET_NUMBER = "6260055671";
const BACKEND_URL = "http://172.16.14.31:5000/api/sos"; // Replace with your laptop's IP

const SOS_OPTIONS = [
  { id: 'medical', label: 'MEDICAL', icon: 'medkit', color: '#ff4d4d' },
  { id: 'fire', label: 'FIRE', icon: 'flame', color: '#ff944d' },
  { id: 'police', label: 'POLICE', icon: 'shield-checkmark', color: '#4d79ff' },
];

export default function SOSScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc.coords);
    })();
  }, []);

  const triggerSOS = async (type) => {
    const googleMapsUrl = location 
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` 
      : "Location Unknown";
    
    const message = `🚨 RESILINET SOS: ${type} 🚨\nTime: ${new Date().toLocaleString()}\nLocation: ${googleMapsUrl}`;

    // Check Connection
    const network = await Network.getNetworkStateAsync();

    if (network.isInternetReachable) {
      // ONLINE: Send to Backend (Email + Admin Portal)
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: type,
            location: { latitude: location.latitude, longitude: location.longitude },
            phone: SOS_TARGET_NUMBER,
            timestamp: new Date()
          }),
        });
        if (response.ok) Alert.alert("Online Alert", "SOS logged and Email sent to Admin.");
      } catch (_error) {
        console.log("Backend sync failed, showing App Chooser...");
      }
    }

    // OFFLINE or Always: Show App Chooser (WhatsApp, SMS, etc.)
    try {
      await Share.share({
        message: message,
        title: 'Emergency SOS',
      });
    } catch (_error) {
      Alert.alert("Error", "Could not open sharing menu");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RESILINET SOS</Text>
        <Text style={styles.subText}>Tap an icon for immediate help</Text>
      </View>
      <View style={styles.grid}>
        {SOS_OPTIONS.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={[styles.sosButton, { backgroundColor: option.color }]} 
            onPress={() => triggerSOS(option.label)}
          >
            <Ionicons name={option.icon} size={50} color="#fff" />
            <Text style={styles.buttonLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 40, paddingTop: 60, alignItems: 'center' },
  headerTitle: { color: '#ff4d4d', fontSize: 28, fontWeight: 'bold' },
  subText: { color: '#888', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  sosButton: { width: 160, height: 160, margin: 10, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  buttonLabel: { color: '#fff', fontWeight: 'bold', marginTop: 15, fontSize: 16 }
});