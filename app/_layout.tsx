import { SplashScreen, Stack, usePathname, useRouter, useSegments } from "expo-router";
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
import { CanteenProvider } from "@/components/CanteenContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(app)';

    if (user) {
      if (!inAuthGroup) {
        router.replace('/(app)/HomeScreen');
      }
    } else {
      if (inAuthGroup) {
        router.replace('/LoginScreen');
      } else if (pathname !== '/LoginScreen') {
        router.replace('/LoginScreen');
      }
    }
  }, [user, loading, segments, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

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
        <CanteenProvider>
          <DrawerProvider>
            <DepartmentProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </DepartmentProvider>
          </DrawerProvider>
        </CanteenProvider>
      </EquipmentProvider>
    </ThemeProvider>
  );
}