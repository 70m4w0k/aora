import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Button, ScrollView } from "react-native";
import { getChores, getLatestChoresImplByChoreId } from "../../lib/appwrite";
import ToDoChoreItem from "../../components/ToDoChoreItem";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/EmptyState";
import CustomButton from "../../components/CustomButton";
import { useGlobalContext } from "../../context/GlobalProvider";
import { createChoreImplementation } from "../../lib/appwrite";

const ChoresListScreen = () => {
  const { user } = useGlobalContext();
  const [chores, setChores] = useState([]);

  useEffect(() => {
    fetchChores();
  }, []);

  const getRelativeTime = (dateString) => {
    const givenDate = new Date(dateString);
    const currentDate = new Date();

    // Calculate the difference in time (in milliseconds)
    const differenceInTime = currentDate - givenDate;

    // Calculate the difference in days
    const differenceInDays = Math.floor(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays === 0) {
      return "today";
    } else if (differenceInDays === 1) {
      return "a day ago";
    } else if (differenceInDays <= 6) {
      return `${differenceInDays} days ago`;
    } else {
      return "a week ago";
    }
  };

  const fetchChores = async () => {
    try {
      const choresList = await getChores(); // Fetch chores from Appwrite
      choresList.forEach(async (chore) => {
        const latestChoreImpl = await getLatestChoresImplByChoreId(chore.$id);
        if (latestChoreImpl[0]) {
          chore.lastDoneTime = getRelativeTime(latestChoreImpl[0].$updatedAt);
          chore.authorName = latestChoreImpl[0].authorId.username;
          chore.isDone = true;
        }
      });

      setChores(choresList); // Assuming `documents` is where the list resides
    } catch (error) {
      console.error("Error fetching chores:", error);
    }
  };

  const submitDone = async (choreId) => {
    try {
      await createChoreImplementation({
        percentageDone: 100,
        userId: user.$id,
        choreId: choreId,
      });
    } catch (error) {
      console.error("Error doneing task : ", error);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">To Do Chores</Text>
        <FlatList
          data={chores}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <ToDoChoreItem
              title={item.title}
              lastTimeDone={`Last time: ${item.lastDoneTime || "N/A"}`}
              byUser={`By: ${item.authorName || "Unknown"}`}
              isDone={item.isDone}
              onPress={() => submitDone(item.$id)}
            />
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Chores Found"
              subtitle="You can create new chores"
            />
          )}
        />
        <View className="flex my-6 px-4 space-y-6"></View>
        <CustomButton
          title="Create New Chore"
          handlePress={() => router.replace("/create-chore")}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChoresListScreen;
