// _layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';
import MyRequests from './myRequests';

const BACKGROUND_COLOR = '#eef0f6ff';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#135796',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: BACKGROUND_COLOR,
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            paddingBottom: Platform.select({
              ios: 0,
              android: 8,
            }),
          },
          tabBarItemStyle: {
            paddingVertical: 5,
          },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              index: 'qr-code-outline',
              LeaveRequest: 'document-text-outline',
              MyRequests: 'create-outline'
            };
            return (
              <Ionicons
                name={icons[route.name] || 'help-circle-outline'}
                size={size}
                color={color}
              />
            );
          },
          unmountOnBlur: false, // Kamera bileşeninin bellekten kaldırılmasını engeller
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'QR' }} />
        <Tabs.Screen name="LeaveRequest" options={{ title: 'Leave Request' }} />
         <Tabs.Screen name="myRequests" options={{ title: 'My Request' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});