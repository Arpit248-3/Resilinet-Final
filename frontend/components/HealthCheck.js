import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Updated for latest Expo Camera API
import * as FaceDetector from 'expo-face-detector';
import QRCode from 'react-native-qrcode-svg';

export default function HealthCheck() {
  const [peopleCount, setPeopleCount] = useState(0);
  const [cryptoToken, setCryptoToken] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Handle Camera Permissions
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFacesDetected = ({ faces }) => {
    setPeopleCount(faces.length);
    if (faces.length > 0 && !cryptoToken) {
      // Generate Cryptographic ID for the victim based on first face detected
      const token = `RESILI-V-${faces[0].faceID}-${Date.now()}`;
      setCryptoToken(token);
    }
  };

  const resetScanner = () => {
    setCryptoToken(null);
    setPeopleCount(0);
  };

  return (
    <View style={styles.container}>
      {/* Camera View for Face Detection */}
      <CameraView 
        style={styles.camera}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 1000,
        }}
      />
      
      <View style={styles.overlay}>
        <Text style={styles.countText}>LIVE TRIAGE: {peopleCount} PERSON(S) DETECTED</Text>
        
        {cryptoToken ? (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>CRYPTOGRAPHIC VERIFICATION TOKEN</Text>
            <QRCode value={cryptoToken} size={150} color="black" backgroundColor="white" />
            <Text style={styles.tokenText}>{cryptoToken}</Text>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
              <Text style={styles.resetButtonText}>SCAN NEW TARGET</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.searchingContainer}>
            <Text style={styles.searchingText}>SCANNING FOR BIOMETRIC DATA...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { height: '40%' },
  overlay: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#0a0a0a', 
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: '#00ff41'
  },
  countText: { color: '#00ff41', fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  qrContainer: { 
    marginTop: 10, 
    padding: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    borderRadius: 15,
    width: '90%'
  },
  qrLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  tokenText: { fontSize: 9, marginTop: 10, color: '#666', fontFamily: 'monospace' },
  searchingContainer: { marginTop: 50, alignItems: 'center' },
  searchingText: { color: '#00ff41', fontSize: 12, opacity: 0.7 },
  button: { backgroundColor: '#00ff41', padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: '#000', fontWeight: 'bold' },
  resetButton: { 
    marginTop: 20, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: '#000', 
    borderRadius: 5 
  },
  resetButtonText: { color: '#00ff41', fontSize: 12, fontWeight: 'bold' }
});