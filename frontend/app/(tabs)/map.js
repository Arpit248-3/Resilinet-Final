import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapTab() {
  const [region, setRegion] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(userRegion);
      
      // Forces the map to move away from San Francisco to your real location
      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    })();
  }, []);

  if (!region) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={{color: '#fff', marginTop: 10}}>Fetching Local Intelligence...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        // The key forces a re-render so it doesn't get stuck in San Francisco
        key={`${region.latitude}-${region.longitude}`}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
      >
        <Marker 
          coordinate={{ latitude: region.latitude, longitude: region.longitude }}
          title="You are here"
          description="Local monitoring active"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loading: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }
});