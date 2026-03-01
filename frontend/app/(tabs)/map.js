import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native'; 
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_LOCATION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function StatusMap() {
  const [region, setRegion] = useState(INITIAL_LOCATION);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region} 
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)} 
        userInterfaceStyle="dark" 
      >
        <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} title="Safe Zone Alpha">
          <View style={[styles.markerCircle, { backgroundColor: '#2ecc71' }]}>
            <Ionicons name="shield-checkmark" size={20} color="white" />
          </View>
        </Marker>

        <Marker 
          coordinate={{ latitude: 37.7910, longitude: -122.4350 }} 
          title="User: Arpit" 
          description="Status: SAFE"
        >
          <View style={[styles.markerCircle, { backgroundColor: '#3498db' }]}>
            <Ionicons name="person" size={18} color="white" />
          </View>
        </Marker>
      </MapView>

      <TouchableOpacity 
        style={styles.myLocationBtn} 
        onPress={() => setRegion(INITIAL_LOCATION)} 
      >
        <Ionicons name="locate" size={24} color="#e63946" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  markerCircle: { padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  myLocationBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});