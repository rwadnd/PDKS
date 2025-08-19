// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth } from '../firebase'; // <- make sure firebase.js is set up with AsyncStorage persistence
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setErr(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setErr(e.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:24 }}>
      <Text style={{ fontSize:28, fontWeight:'700', marginBottom:20 }}>Sign In</Text>
      
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth:1, borderRadius:12, padding:12, marginBottom:12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth:1, borderRadius:12, padding:12, marginBottom:12 }}
      />

      {err && <Text style={{ color:'red', marginBottom:12 }}>{err}</Text>}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Login" onPress={signIn} />
          <TouchableOpacity onPress={register} style={{ marginTop:12 }}>
            <Text style={{ textAlign:'center', color:'blue' }}>Create new account</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
