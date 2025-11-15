import { Stack } from "expo-router";

export default function SportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Rent" />
      <Stack.Screen name="Return" />
    </Stack>
  );
}
