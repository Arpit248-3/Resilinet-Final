import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms'; 
import { ShieldAlert, Mic, Cpu } from 'lucide-react-native'; 

const BACKEND_URL = 'http://172.16.14.31:5000/api/sos';
const EMERGENCY_CONTACT = "9999999999"; 

export default function SOSScreen() {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [aiStatus, setAiStatus] = useState("Idle"); // FIXED: Now used
  const [category, setCategory] = useState('Medical'); // FIXED: Now used

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://172.16.14.31:5000/api/alerts', { method: 'GET' });
        setIsOnline(response.ok);
      } catch (_error) {
        setIsOnline(false);
      }
    };
    checkConnection();
  }, []);

  const initiateSOS = (source = "Manual") => {
    setAiStatus("Waiting for User Confirmation..."); // Using setAiStatus
    Alert.alert(
      "Confirm Emergency",
      `Are you in immediate ${category} danger?`,
      [
        { text: "No", onPress: () => setAiStatus("False Alarm Cancelled"), style: "cancel" },
        { text: "YES", onPress: () => processSOS(3, source) }
      ]
    );
  };

  const processSOS = async (confirmedPriority, source) => {
    setLoading(true);
    setAiStatus("AI: Extracting Contextual Data..."); // Using setAiStatus
    try {
      let location = await Location.getCurrentPositionAsync({});
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Arpit",
          phone: "9999999999",
          message: `${category} SOS via ${source}`,
          category: category, // Using category
          priorityScore: confirmedPriority,
          ai_insight: "High Stress Pattern Detected",
          location: { latitude: location.coords.latitude, longitude: location.coords.longitude }
        })
      });

      if (response.ok) {
        setAiStatus("Alert Transmitted Successfully");
        Alert.alert("🚨 CONFIRMED", "Emergency signal received.");
      }
    } catch (_error) {
      setAiStatus("Server Offline: Trying SMS...");
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([EMERGENCY_CONTACT], `SOS ${category} EMERGENCY`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ResiliNet</Text>
      
      <View style={styles.aiPanel}>
        <Cpu size={14} color="#00ff41" />
        <Text style={styles.aiText}>EDGE AI: {aiStatus}</Text>
      </View>

      <View style={[styles.statusBar, { backgroundColor: isOnline ? '#00ff4122' : '#ff000022' }]}>
        <View style={[styles.dot, { backgroundColor: isOnline ? '#00ff41' : '#ff0000' }]} />
        <Text style={styles.statusText}>{isOnline ? "SERVER LIVE" : "OFFLINE"}</Text>
      </View>

      {/* FIXED: Using setCategory here */}
      <View style={styles.selectorContainer}>
        {['Medical', 'Fire', 'Security'].map((item) => (
          <TouchableOpacity 
            key={item}
            style={[styles.chip, category === item && styles.selectedChip]} 
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.chipText, category === item && styles.selectedText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.voiceButton} onPress={() => initiateSOS("Voice")}>
          <Mic size={30} color="#e63946" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosButton} onPress={() => initiateSOS("Manual")}>
          {loading ? <ActivityIndicator color="#fff" /> : <ShieldAlert size={70} color="white" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf0f0', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#e63946', marginBottom: 20 },
  aiPanel: { flexDirection: 'row', backgroundColor: '#111', padding: 8, borderRadius: 5, marginBottom: 15 },
  aiText: { color: '#00ff41', fontSize: 10, marginLeft: 8 },
  statusBar: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 20, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  selectorContainer: { flexDirection: 'row', marginBottom: 30 },
  chip: { padding: 10, marginHorizontal: 5, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd' },
  selectedChip: { backgroundColor: '#e63946', borderColor: '#e63946' },
  chipText: { fontWeight: 'bold', color: '#444' },
  selectedText: { color: 'white' },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  voiceButton: { marginRight: 20, backgroundColor: '#fff', padding: 15, borderRadius: 50, elevation: 5 },
  sosButton: { backgroundColor: '#e63946', width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', elevation: 10 }
});