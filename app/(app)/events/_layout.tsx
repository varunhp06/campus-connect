import { OpenSans_300Light, OpenSans_400Regular, OpenSans_700Bold, useFonts } from '@expo-google-fonts/open-sans';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';

 

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
      OpenSans_Bold: OpenSans_700Bold,
      OpenSans_Regular: OpenSans_400Regular,
      OpenSans_Light: OpenSans_300Light,
    });
  
    useEffect(() => {
      if (fontsLoaded) {
        SplashScreen.hideAsync();
      }
    }, [fontsLoaded]);
  
    if (!fontsLoaded) {
      return null;
    }
  return (
    <Stack
      screenOptions={{
        headerShown: false, 
      }}
    >
      <Stack.Screen 
        name="AllEventsScreen" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EventsManagementScreen" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}