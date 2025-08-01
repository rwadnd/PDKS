import axios from 'axios';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ data }) => {
    setScanned(true);
    setToken(data);
    Alert.alert('QR Code scanned', `Token: ${data}`);
    setTimeout(() => setScanned(false), 3000);
  };

  const handleSubmit = async () => {
    if (!employeeId || !token) {
      Alert.alert('Missing Info', 'Please scan a QR code and enter an Employee ID.');
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.141:5000/api/pdks/submit', {
        token,
        employeeId,
      });

      Alert.alert('Success', response.data.message || 'Data sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send data');
      console.error(error);
    }
  };

  if (hasPermission === null) {
    return <Text style={styles.centered}>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text style={styles.centered}>No access to camera</Text>;
  }

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

        {/* CameraView inside wrapper */}
        <View style={styles.cameraWrapper}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Employee ID"
        keyboardType="numeric"
        value={employeeId}
        onChangeText={setEmployeeId}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <Text style={styles.project}>A Project Done in OSB Teknokent by:</Text>
      <Text style={styles.credits}>İpek Zorpineci - Ravad Nadam - Sude Terkan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingTop: 35,
    alignItems: 'center',
    backgroundColor: '#eef0f6ff',
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#135796',
  },
  subtitle: {
    marginTop: 24,
    marginBottom: 4,
    fontSize: 14,
  },
  cameraContainer: {
    width: '83%',
    height: '47%',
    marginVertical: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    width: '90%',
    height: '91%',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    width: '85%',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#135796',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '85%',
    height: 52,
    marginTop: 16,
    justifyContent: "center"
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    alignSelf: "center",
  },
  project: {
    position: 'absolute',
    bottom: 55,
    fontSize: 12,
    color: '#888',
  },
  credits: {
    position: 'absolute',
    bottom: 35,
    fontSize: 12,
    color: '#135796',
    fontWeight: "500"
    
  },

  // ✅ Corner overlays
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#135796',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
});
