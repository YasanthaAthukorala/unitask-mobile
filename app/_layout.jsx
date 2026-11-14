import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { initializeDatabase } from '../database/database';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeDatabase()
      .then(() => setReady(true))
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="task/[id]" options={{ headerShown: true, title: 'Task Details' }} />
        <Stack.Screen name="edit-task/[id]" options={{ headerShown: true, title: 'Edit Task' }} />
      </Stack>
      {!ready && (
        <View style={styles.overlay}>
          {error ? <Text style={styles.error}>Database Error: {error}</Text> : <ActivityIndicator size="large" color="#5145CD" />}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F7F7FC', justifyContent: 'center', alignItems: 'center', zIndex: 10, padding: 30 },
  error: { textAlign: 'center' },
});
