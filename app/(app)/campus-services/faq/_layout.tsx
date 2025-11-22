import { Stack } from "expo-router";

export default function SportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="add" />
      <Stack.Screen name="request" />
      <Stack.Screen name="view-requests" />
      <Stack.Screen name="view-faqs" />
    </Stack>
  );
}
