import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts, OpenSans_400Regular, OpenSans_700Bold, OpenSans_300Light } from '@expo-google-fonts/open-sans';

SplashScreen.preventAutoHideAsync();

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
    </Stack>
  );
}