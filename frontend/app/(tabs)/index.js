import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Audio } from 'expo-av';

const SOS_TARGET_NUMBER = "6260055671";
const BACKEND_URL = "http://172.16.14.31:5000/api/sos"; 

const SOS_OPTIONS = [
  { id: 'medical', label: 'MEDICAL', icon: 'medkit', color: '#ff4d4d' },
  { id: 'fire', label: 'FIRE', icon: 'flame', color: '#ff944d' },
  { id: 'police', label: 'POLICE', icon: 'shield-checkmark', color: '#4d79ff' },
];

export default function SOSScreen() {
  const [location, setLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc.coords);
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  const triggerSOS = async (type, voiceUri) => {
    const network = await Network.getNetworkStateAsync();

    if (network.isInternetReachable && location) {
      const formData = new FormData();
      formData.append('audio', {
        uri: voiceUri,
        name: `sos_${Date.now()}.m4a`,
        type: 'audio/m4a',
      });
      formData.append('phone', SOS_TARGET_NUMBER);
      formData.append('category', type);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());

      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.ok) {
          Alert.alert("Success", "Audio SOS uploaded to ResiliNet Hub.");
        }
      } catch (err) {
        console.log("Offline fallback triggered:", err);
      }
    }

    const message = `🚨 SOS: ${type} 🚨\nLocation: https://www.google.com/maps?q=${location?.latitude},${location?.longitude}`;
    await Share.share({ message });
  };

  const startVoiceCapture = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) { 
      console.error("Recording Start Error:", err); 
    }
  };

  const stopAndTriggerSOS = async (type) => {
    setIsRecording(false);
    if (!recordingRef.current) return;
    try {
      const status = await recordingRef.current.getStatusAsync();
      if (status.isRecording || status.canRecord) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        await triggerSOS(type, uri);
      }
    } catch (error) {
      console.error("Stop Error:", error);
      recordingRef.current = null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RESILINET SOS</Text>
        <Text style={[styles.subText, isRecording && {color: '#00ff41', fontWeight: 'bold'}]}>
          {isRecording ? "🔴 RECORDING... RELEASE TO SEND" : "HOLD A BUTTON TO RECORD SOS"}
        </Text>
      </View>
      <View style={styles.grid}>
        {SOS_OPTIONS.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={[styles.sosButton, { backgroundColor: option.color }]} 
            onPressIn={startVoiceCapture}
            onPressOut={() => stopAndTriggerSOS(option.label)}
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
  subText: { color: '#888', marginTop: 10, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  sosButton: { width: 160, height: 160, margin: 10, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  buttonLabel: { color: '#fff', fontWeight: 'bold', marginTop: 15 }
});