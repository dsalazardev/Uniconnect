import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navbar } from '@/src/components/Navbar'; 

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <Navbar />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="community" />
        <Stack.Screen name="profile" />
      </Stack>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363636',
  },
});