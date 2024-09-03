import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Button } from "react-native";
import { getChores } from "../../lib/appwrite";
import ToDoChoreItem from "../../components/ToDoChoreItem";
import { router } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/EmptyState";
import CustomButton from "../../components/CustomButton";

const ChoresListScreen = () => {
  const [chores, setChores] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchChores();
  }, []);

  const fetchChores = async () => {
    try {
      const choresList = await getChores(); // Fetch chores from Appwrite
      setChores(choresList); // Assuming `documents` is where the list resides
    } catch (error) {
      console.error("Error fetching chores:", error);
    }
  };

  const submitDone = (choreId) => {
    try {
    } catch (error) {
      console.error("Error doneing task : ", error);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={chores}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <ToDoChoreItem
            title={item.title}
            lastTimeDone={`Last time: ${item.lastDoneTime || "N/A"}`}
            byUser={`By: ${item.authorName || "Unknown"}`}
            onPress={() => submitDone(item.$id)}
          />
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Chores Found"
            subtitle="You can create new chores"
          />
        )}
        ListHeaderComponent={() => (
          // <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
          //   <InfoBox
          //     title={user?.username}
          //     containerStyles="mt-5"
          //     titleStyles="text-lg"
          //   />

          //   <View className="mt-5 flex flex-row">
          //     <InfoBox
          //       title={posts.length || 0}
          //       subtitle="Posts"
          //       titleStyles="text-xl"
          //       containerStyles="mr-10"
          //     />
          //     <InfoBox
          //       title="1.2k"
          //       subtitle="Followers"
          //       titleStyles="text-xl"
          //     />
          //   </View>
          // </View>
          <Text>Hello World</Text>
        )}
      />

      <View className="flex my-6 px-4 space-y-6"></View>
      <CustomButton
        title="Create New Chore"
        handlePress={() => router.replace("/create-chore")}
      />
    </SafeAreaView>
  );
};

export default ChoresListScreen;
