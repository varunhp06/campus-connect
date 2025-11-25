import { Stack } from "expo-router";

export default function SportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="lost" />
      <Stack.Screen name="found" />
      <Stack.Screen name="my-items" />
    </Stack>
  );
}
