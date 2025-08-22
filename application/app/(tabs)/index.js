// index.js
import axios from 'axios';
import { CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { auth, db } from '../../firebase';    
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import * as Location from 'expo-location';  // ⬅️ NEW






// ====== Geofence config (circle) ======
const GEOFENCE = {
  // Example: your office entrance
  lat: 37.1592502,         // ⬅️ set this
  lng: 37.2931337,         // ⬅️ set this
  radiusMeters: 120,      // ⬅️ allowable radius
};

// Haversine distance in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius (m)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}



export default function App() {
  const [hasPermission] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [employeeId, setEmployeeId] = useState('');   // will be filled from Firestore
  const [token, setToken] = useState('');
  const [loadingUserId, setLoadingUserId] = useState(true);
  const isFocused = useIsFocused();



  
  // Get employee ID from Firestore users/{uid}
  useEffect(() => {
    setLoadingUserId(true);
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setEmployeeId('');
        setLoadingUserId(false);
        Alert.alert('Not signed in', 'Please log in to scan and submit.');
        return;
      }

      // subscribe live to the user document (or use getDoc once if you prefer)
      const ref = doc(db, 'users', u.uid);
      const unsubDoc = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() || {};
            // Your field is "ID" per screenshot; fallback to "id" if you rename later
            const idFromDoc = data.ID ?? data.id ?? '';
            setEmployeeId(String(idFromDoc || ''));
          } else {
            setEmployeeId('');
            Alert.alert('Profile missing', 'No user document found in Firestore.');
          }
          setLoadingUserId(false);
        },
        (err) => {
          console.error('users doc error:', err);
          setLoadingUserId(false);
          Alert.alert('Error', 'Failed to load user profile.');
        }
      );

      // cleanup Firestore listener when auth user changes
      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  const handleBarcodeScanned = ({ data }) => {
    setScanned(true);
    setToken(data);
    Alert.alert('QR Code scanned', `Token: ${data}`);
    setTimeout(() => setScanned(false), 3000);
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      Alert.alert('Missing ID', 'Could not read your Employee ID from Firestore.');
      return;
    }
    if (!token) {
      Alert.alert('Missing QR', 'Please scan a QR code first.');
      return;
    }

    try {
      // 1) Ask permission for foreground location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Allow location to verify you are on site.');
        return;
      }

      // 2) Get current GPS fix
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // good tradeoff; you can try High
        // maximumAge: 10000, // optionally accept last 10s fix
        // timeout: 8000,
      });

      const { latitude, longitude } = pos.coords;

      // 3) Check distance to geofence center
      const d = distanceMeters(latitude, longitude, GEOFENCE.lat, GEOFENCE.lng);
      if (d > GEOFENCE.radiusMeters) {
        Alert.alert(
          'Out of zone',
          `You are ${Math.round(d)} m away. You must be within ${GEOFENCE.radiusMeters} m of the site.`
        );
        return;
      }

      // 4) Submit with location included (recommended)
      const response = await axios.post('http://192.168.1.141:5050/api/pdks/submit', {
        token,
        employeeId: Number(employeeId) || employeeId,
        location: { lat: latitude, lng: longitude },
      });

      Alert.alert('Success', response.data.message || 'Data sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to verify location or send data');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Control System</Text>
      <Text style={styles.subtitle}>Please Scan The QR Code</Text>

      <View style={styles.cameraContainer}>
        {/* Corner Borders */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* CameraView only renders when the tab is focused */}
        <View style={styles.cameraWrapper}>
          {isFocused && hasPermission && (
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
        </View>
      </View>

      {/* Read-only Employee ID from Firestore */}
      <TextInput
        style={styles.input}
        placeholder="Employee ID"
        value={loadingUserId ? 'Loading…' : String(employeeId || '')}
        editable={false}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loadingUserId}>
        <Text style={styles.buttonText}>{loadingUserId ? 'Loading…' : 'Submit'}</Text>
      </TouchableOpacity>

      <Text style={styles.project}>A Project Done in OSB Teknokent by:</Text>
      <Text style={styles.credits}>İpek Zorpineci - Ravad Nadam - Sude Terkan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingTop: 35, alignItems: 'center', backgroundColor: '#eef0f6ff', flex: 1 },
  header: { fontSize: 18, fontWeight: 'bold', color: '#135796' },
  subtitle: { marginTop: 24, marginBottom: 4, fontSize: 14 },
  cameraContainer: { width: '83%', height: '47%', marginVertical: 16, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  cameraWrapper: { width: '90%', height: '91%', borderRadius: 6, overflow: 'hidden', backgroundColor: '#eee' },
  input: { borderWidth: 1, borderColor: '#ddd', width: '85%', padding: 12, borderRadius: 8, marginTop: 8 },
  button: { backgroundColor: '#135796', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, width: '85%', height: 52, marginTop: 16, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', alignSelf: 'center' },
  project: { position: 'absolute', bottom: 55, fontSize: 12, color: '#888' },
  credits: { position: 'absolute', bottom: 35, fontSize: 12, color: '#135796', fontWeight: '500' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#135796' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
});
