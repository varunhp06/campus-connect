import { Stack } from "expo-router";

export default function SportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Rent/index" />
      <Stack.Screen name="Return/index" />
      <Stack.Screen name="Inventory/index" />
      <Stack.Screen name="EntryLogs/index" />
      <Stack.Screen name="ScanQr/index" />
    </Stack>
  );
}
