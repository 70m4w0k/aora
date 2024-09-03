import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

const CustomButtonGroup = ({
  options,
  selectedOption,
  onSelect,
  containerStyles,
  textStyles,
}) => {
  return (
    <View className={`flex flex-row justify-around my-10 ${containerStyles}`}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            onSelect(option.value);
          }}
          className={`rounded-xl min-h-[50px] flex flex-row justify-center items-center p-10 mr-5 ${
            selectedOption === option.value ? "bg-secondary" : "bg-gray-100"
          }`}
        >
          <Text className={`text-primary font-psemibold text-lg ${textStyles}`}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CustomButtonGroup;
