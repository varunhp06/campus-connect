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
        name="AdministrationSection" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="LostAndFoundSection" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="FAQSection" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="events" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}