import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const SOS_TARGET_NUMBER = "6260055671";

const SOS_OPTIONS = [
  { id: 'medical', label: 'MEDICAL', icon: 'medkit', color: '#ff4d4d' },
  { id: 'fire', label: 'FIRE', icon: 'flame', color: '#ff944d' },
  { id: 'police', label: 'POLICE', icon: 'shield-checkmark', color: '#4d79ff' },
];

export default function SOSScreen() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("Detecting location...");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress("Permission denied");
        return;
      }
      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc.coords);
    })();
  }, []);

  const triggerSOS = (type) => {
    const message = `🚨 SOS: ${type} 🚨\nLocation: ${address}`;
    const smsUrl = Platform.OS === 'android' 
      ? `sms:${SOS_TARGET_NUMBER}?body=${encodeURIComponent(message)}` 
      : `sms:${SOS_TARGET_NUMBER}&body=${encodeURIComponent(message)}`;

    Linking.openURL(smsUrl).catch(() => Alert.alert("Error", "Check SMS app"));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RESILINET SOS</Text>
        {location && <Text style={styles.locationText}>📍 Lat: {location.latitude.toFixed(4)}</Text>}
      </View>
      <View style={styles.grid}>
        {SOS_OPTIONS.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={[styles.sosButton, { backgroundColor: option.color }]} 
            onPress={() => triggerSOS(option.label)}
          >
            <Ionicons name={option.icon} size={40} color="#fff" />
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
  locationText: { color: '#666', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  sosButton: { width: '45%', height: 140, margin: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  buttonLabel: { color: '#fff', fontWeight: 'bold', marginTop: 10 }
});