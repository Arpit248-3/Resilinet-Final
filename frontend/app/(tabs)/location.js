import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [isSafe, setIsSafe] = useState(false);
  const mapRef = useRef(null); 

  // 1. Get Live Location on Load
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location access is required for SOS features.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(userRegion);
      
      // Animate to user location once data is received
      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    })();
  }, []);

  // 2. Center map on user manually
  const goToMyLocation = () => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    } else {
      Alert.alert("Locating...", "Still fetching your GPS coordinates.");
    }
  };

  // 3. Update Safety Status to Backend
  const toggleSafetyStatus = async () => {
    if (!region) return;
    const newStatus = !isSafe;
    setIsSafe(newStatus);
    
    try {
      // Updated URL to match the POST /api/sos route in server.js
      await fetch(`http://172.16.14.31:5000/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: "Mobile User",
          phone: "6260055671",
          category: "Manual Status Update",
          ai_insight: newStatus ? "User marked safe." : "User requesting help.",
          priority: newStatus ? "Low" : "High",
          location: { 
            latitude: region.latitude,
            longitude: region.longitude
          }
        }),
      });
      Alert.alert("Status Updated", `You are now marked as ${newStatus ? 'SAFE' : 'IN DANGER'}`);
    } catch (_error) {
      console.log("Status updated locally. Sync failed.");
    }
  };

  if (!region) {
    return (
      <View style={styles.loading}>
        <Text style={{color: '#fff'}}>🛰️ Synchronizing GPS with Satellite Hub...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        /** * FIX: The 'key' forces the map to refresh and snap to YOUR location 
         * instead of defaulting to San Francisco (Google HQ).
         */
        key={region ? `${region.latitude}-${region.longitude}` : 'loading'} 
        style={styles.map} 
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false} 
        followsUserLocation={true}
      >
        <Marker 
          coordinate={{ latitude: region.latitude, longitude: region.longitude }} 
          pinColor={isSafe ? "green" : "red"} 
          title="My Emergency Point"
        />
      </MapView>

      {/* SOS Toggle Button */}
      <TouchableOpacity 
        style={[styles.safeButton, { backgroundColor: isSafe ? '#4CAF50' : '#F44336' }]} 
        onPress={toggleSafetyStatus}
      >
        <Text style={styles.buttonText}>{isSafe ? "MARK AS DANGER" : "I AM SAFE"}</Text>
      </TouchableOpacity>

      {/* GPS Centering Button */}
      <TouchableOpacity style={styles.gpsButton} onPress={goToMyLocation}>
        <Text style={{fontSize: 22}}>🎯</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loading: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  safeButton: { 
    position: 'absolute', 
    bottom: 30, 
    alignSelf: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 30, 
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  gpsButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2
  }
});