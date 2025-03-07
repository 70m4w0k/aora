import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const CalendarLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="calendar"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default CalendarLayout;
