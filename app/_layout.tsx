import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_700Bold,
  OpenSans_300Light,
} from "@expo-google-fonts/open-sans";
import { ThemeProvider } from "../components/ThemeContext";
import { DrawerProvider } from "@/components/DrawerContext";
import { EquipmentProvider } from "@/components/EquipmentContext";
import { DepartmentProvider } from "@/components/DepartmentContext";

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
    <ThemeProvider>
      <EquipmentProvider>
        <DrawerProvider>
          <DepartmentProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="LoginScreen"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(app)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
          </DepartmentProvider>
        </DrawerProvider>
      </EquipmentProvider>
    </ThemeProvider>
  );
}
