import { Stack } from "expo-router";

const DocumentsLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
};

export default DocumentsLayout;

