import React from "react";
import { View, Text, Button } from "react-native";
import CustomButton from "./CustomButton";
import BouncyCheckbox from "react-native-bouncy-checkbox";

const ToDoChoreItem = ({
  title,
  lastTimeDone,
  byUser,
  onPress,
  otherStyles,
}) => {
  return (
    <View className={`space-y-2 mt-3 ${otherStyles}`}>
      <View className="w-full px-4 bg-black-100 rounded-2xl border-2 gap-2 border-black-200 focus:border-secondary flex flex-row align-center justify-center items-center">
        <View className="flex-1 p-3">
          <Text className="text-base text-gray-100 font-psemibold">
            {title}
          </Text>
          <Text className="text-sm text-gray-100 font-plight">
            {lastTimeDone}
          </Text>
          <Text className="text-sm text-gray-100 font-plight">{byUser}</Text>
        </View>
        <CustomButton
          containerStyles="w-[62px] h-[62px] rounded-full"
          title={"🧹"}
          handlePress={onPress}
        />
      </View>
    </View>
  );
};

export default ToDoChoreItem;
