import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This points to your (tabs) folder */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* This allows guide-detail to slide up as a modal or separate screen */}
      <Stack.Screen 
        name="guide-detail" 
        options={{ 
          presentation: 'modal', 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}