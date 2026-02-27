import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { ShieldAlert, Activity, Flame, ShieldCheck } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';

const BACKEND_URL = 'http://172.16.14.31:5000/api/sos';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [category, setCategory] = useState('Medical'); // Default Category

  const sendSOS = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required!');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setMyLocation(location.coords);
      
      // Prioritization Logic: 3 = High, 2 = Medium, 1 = Low
      const priorityLevel = category === 'Medical' ? 3 : (category === 'Fire' ? 2 : 1);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: "Arpit",
          category: category,
          priority: priorityLevel,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
        })
      });

      if (response.ok) {
        Alert.alert("🚨 " + category.toUpperCase() + " ALERT SENT", "Emergency responders have been notified via the Command Center.");
      } else {
        throw new Error("Network issue");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ResiliNet</Text>
      
      {/* Category Selector for Stakeholders */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity 
          style={[styles.chip, category === 'Medical' && styles.selectedChip]} 
          onPress={() => setCategory('Medical')}
        >
          <Activity size={20} color={category === 'Medical' ? 'white' : 'red'} />
          <Text style={[styles.chipText, category === 'Medical' && styles.selectedText]}>Medical</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.chip, category === 'Fire' && styles.selectedChip]} 
          onPress={() => setCategory('Fire')}
        >
          <Flame size={20} color={category === 'Fire' ? 'white' : 'orange'} />
          <Text style={[styles.chipText, category === 'Fire' && styles.selectedText]}>Fire</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.chip, category === 'Security' && styles.selectedChip]} 
          onPress={() => setCategory('Security')}
        >
          <ShieldCheck size={20} color={category === 'Security' ? 'white' : 'blue'} />
          <Text style={[styles.chipText, category === 'Security' && styles.selectedText]}>Security</Text>
        </TouchableOpacity>
      </View>

      {myLocation && (
        <MapView 
          style={styles.map}
          initialRegion={{
            latitude: myLocation.latitude,
            longitude: myLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={myLocation} pinColor="red" />
        </MapView>
      )}

      <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" size="large" /> : <ShieldAlert size={100} color="white" />}
      </TouchableOpacity>
      
      <Text style={styles.subText}>{loading ? `Sending ${category} Signal...` : `Tap for ${category} SOS`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf0f0', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#e63946', position: 'absolute', top: 60 },
  selectorContainer: { flexDirection: 'row', marginBottom: 20, marginTop: 100 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, marginHorizontal: 5, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  selectedChip: { backgroundColor: '#e63946', borderColor: '#e63946' },
  chipText: { marginLeft: 5, color: '#444', fontWeight: 'bold' },
  selectedText: { color: 'white' },
  map: { width: Dimensions.get('window').width - 40, height: 180, borderRadius: 15, marginBottom: 30 },
  sosButton: { backgroundColor: '#e63946', width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  subText: { marginTop: 20, fontSize: 18, color: '#666', fontWeight: '600' }
});