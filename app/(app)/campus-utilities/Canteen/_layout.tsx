import { Stack } from "expo-router";

export default function CanteenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="User/[shop]" />
      <Stack.Screen name="User/Bill" />
      <Stack.Screen name="User/Cart" />
      <Stack.Screen name="User/OrderHistory" />
    </Stack>
  );
}
