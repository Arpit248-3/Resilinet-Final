import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Switch, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function StatusMap() {
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [victimLocations, setVictimLocations] = useState([]);

  useEffect(() => {
    if (isVolunteer) {
      fetch('http://172.16.14.31:5000/api/alerts')
        .then(res => res.json())
        .then(data => setVictimLocations(data))
        .catch(() => console.log("Offline"));
    }
  }, [isVolunteer]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Volunteer Mode</Text>
        <Switch value={isVolunteer} onValueChange={setIsVolunteer} trackColor={{ true: "#e63946" }} />
      </View>

      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: 28.6139, // Example: New Delhi
          longitude: 77.2090,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={{ latitude: 28.62, longitude: 77.21 }} title="Safe Zone" pinColor="green" />

        {isVolunteer && victimLocations.map((loc) => (
          <Marker 
            key={loc._id}
            coordinate={{ 
              latitude: loc.location.latitude, 
              longitude: loc.location.longitude 
            }}
            title={loc.name}
            pinColor="orange"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', alignItems: 'center' },
  headerText: { fontWeight: 'bold', color: '#e63946' },
  map: { flex: 1 } 
});