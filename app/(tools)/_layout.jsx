import { Stack } from "expo-router";

const ToolsLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="documents" />
      <Stack.Screen name="prices" />
      <Stack.Screen name="habits" />
    </Stack>
  );
};

export default ToolsLayout;

