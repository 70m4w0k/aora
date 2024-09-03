import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// import { Loader } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const ChoresLayout = () => {
  const { loading, isLogged } = useGlobalContext();

  // if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <>
      <Stack>
        <Stack.Screen
          name="create-chore"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {/* <Loader isLoading={loading} /> */}
      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default ChoresLayout;
