import { AuthProvider, useAuth } from "@/components/AuthContext";
import { CanteenProvider } from "@/components/CanteenContext";
import { DepartmentProvider } from "@/components/DepartmentContext";
import { DialogProvider } from "@/components/DialogContext";
import { DrawerProvider } from "@/components/DrawerContext";
import { EquipmentProvider } from "@/components/EquipmentContext";
import { ToastProvider } from "@/components/ToastContext";
import {
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_700Bold,
  useFonts,
} from "@expo-google-fonts/open-sans";
import Constants from "expo-constants";
import { SplashScreen, Stack, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider } from "../components/ThemeContext";

 

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  console.log(
    "API KEY:",
    Constants.expoConfig?.extra?.firebaseApiKey
  );

useEffect(() => {
  if (loading) return;

  const inAppGroup = segments?.[0] === "(app)";

  if (user && !inAppGroup) {
    router.replace("/(app)/HomeScreen");
  }

  if (!user && inAppGroup) {
    router.replace("/LoginScreen");
  }
}, [user, loading, segments]);


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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <DialogProvider>
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
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}