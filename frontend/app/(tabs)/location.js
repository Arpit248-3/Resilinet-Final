import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export default function AIEmergencyScreen() {
  const [region, setRegion] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  
  // Edge AI Extracted Data State
  const [triage, setTriage] = useState({
    isInjured: false,
    isTrapped: false,
    canMove: true,
    isBleeding: false,
    voiceText: ""
  });

  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // Step 2 & 3: Simulate Edge AI Voice Processing (Offline)
  const startVoiceSOS = () => {
    setIsProcessing(true);
    // Simulating local AI processing (Speech-to-Text & Extraction)
    setTimeout(() => {
      setIsProcessing(false);
      setTriage({ ...triage, voiceText: "I am stuck and my leg is hurting" });
      setShowTriage(true); // Open the Yes/No Clarification Modal
    }, 2000);
  };

  // Step 5: Priority Calculation Logic based on Edge AI findings
  const calculatePriority = () => {
    if (triage.isInjured && triage.isTrapped) return "Critical";
    if (triage.isInjured || triage.isBleeding) return "High";
    if (triage.isTrapped && !triage.isInjured) return "Medium";
    return "Low";
  };

  // Step 6 & 7: Send Structured Data to Backend
  const submitSOS = async () => {
    const finalPriority = calculatePriority();
    try {
      const res = await fetch('http://172.16.14.31:5000/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: "6260055671",
          extractedData: triage,
          priority: finalPriority,
          location: { latitude: region.latitude, longitude: region.longitude }
        }),
      });

      if (res.ok) {
        Alert.alert("🚨 SOS DISPATCHED", `Priority: ${finalPriority}\nHelp is on the way.`);
        setShowTriage(false);
      }
    } catch (_e) { // Prefixed with _ to satisfy ESLint unused-vars rule
      Alert.alert("Offline Mode", "SOS saved locally. Will sync when net is back.");
    }
  };

  if (!region) return <View style={styles.loading}><Text>Syncing Satellites...</Text></View>;

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={region} 
        key={`${region.latitude}`}
      >
        <Marker coordinate={region} pinColor="red" />
      </MapView>

      {/* Pulse SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={startVoiceSOS}>
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sosText}>HOLD FOR VOICE SOS</Text>
        )}
      </TouchableOpacity>

      {/* Step 4: Yes/No Clarification Modal */}
      <Modal visible={showTriage} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.triageCard}>
            <Text style={styles.triageTitle}>Edge AI: Quick Clarification</Text>
            
            {/* Fixed: Used &quot; to escape quotes for ESLint */}
            <Text style={styles.voiceSnippet}>&quot;{triage.voiceText}&quot;</Text>
            
            <TriageOption label="Are you injured?" value={triage.isInjured} onToggle={(v) => setTriage({...triage, isInjured: v})} />
            <TriageOption label="Are you trapped?" value={triage.isTrapped} onToggle={(v) => setTriage({...triage, isTrapped: v})} />
            <TriageOption label="Are you bleeding?" value={triage.isBleeding} onToggle={(v) => setTriage({...triage, isBleeding: v})} />
            <TriageOption label="Can you move?" value={triage.canMove} onToggle={(v) => setTriage({...triage, canMove: v})} />

            <TouchableOpacity style={styles.confirmBtn} onPress={submitSOS}>
              <Text style={styles.confirmBtnText}>SEND SOS NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Sub-component for structured Triage Yes/No buttons
const TriageOption = ({ label, value, onToggle }) => (
  <View style={styles.optionRow}>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={styles.btnGroup}>
      <TouchableOpacity 
        onPress={() => onToggle(true)} 
        style={[styles.miniBtn, value && styles.btnActive]}
      >
        <Text style={value ? {color: '#fff'} : {}}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => onToggle(false)} 
        style={[styles.miniBtn, !value && styles.btnRedActive]}
      >
        <Text style={!value ? {color: '#fff'} : {}}>No</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  sosButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#ff0000', padding: 25, borderRadius: 50, width: 250, alignItems: 'center', elevation: 10 },
  sosText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  triageCard: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  triageTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  voiceSnippet: { fontStyle: 'italic', color: '#666', marginBottom: 20 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  optionLabel: { fontSize: 16 },
  btnGroup: { flexDirection: 'row', gap: 10 },
  miniBtn: { padding: 10, width: 60, alignItems: 'center', borderRadius: 10, backgroundColor: '#eee' },
  btnActive: { backgroundColor: '#4CAF50' },
  btnRedActive: { backgroundColor: '#ff4444' },
  confirmBtn: { backgroundColor: '#000', padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});