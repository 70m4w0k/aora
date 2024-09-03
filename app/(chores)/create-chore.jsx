import { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Alert, ScrollView } from "react-native";

import { createChore } from "../../lib/appwrite";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import CustomButtonGroup from "../../components/CustomButtonGroup";

const CreateChore = () => {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    iconUrl: "",
    recurrence: "",
  });

  const submit = async () => {
    console.log(form);
    if ((form.title === "") | (form.recurrence === "")) {
      return Alert.alert("Please provide all fields");
    }

    setUploading(true);
    try {
      await createChore({
        ...form,
      });

      Alert.alert("Success", "Post uploaded successfully");
      router.push("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setForm({
        title: "",
        video: null,
        thumbnail: null,
        prompt: "",
      });

      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">
          Create new Chore
        </Text>

        <FormField
          title="Chore Title"
          value={form.title}
          placeholder="clean the toilet with a toothbrush, ..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles="mt-10"
        />

        <CustomButtonGroup
          options={[
            { label: "Daily", value: "Daily" },
            { label: "Weekly", value: "Weekly" },
            { label: "Monthly", value: "Monthly" },
          ]}
          selectedOption={form.recurrence}
          onSelect={(e) => {
            setForm({ ...form, recurrence: e });
          }}
        />

        <CustomButton
          title="Create new chore"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateChore;
