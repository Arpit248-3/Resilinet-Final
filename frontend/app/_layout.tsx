import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated'; // This helps fix the Worklets error

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Ensure that reloading on `/guide-detail` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main Tab Navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Guide Detail Screen (merged from your .js file) */}
        <Stack.Screen 
          name="guide-detail" 
          options={{ 
            presentation: 'modal', 
            headerShown: false 
          }} 
        />

        {/* Default Modal Screen */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}