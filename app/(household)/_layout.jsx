import { Stack } from "expo-router";

const HouseholdLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="join"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default HouseholdLayout;

