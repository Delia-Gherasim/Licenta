import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import Add from "./Add";
import Analyze from "./Analyze";
import Post from "./Post";

const Stack = createStackNavigator();

export default function AddStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddMain" component={Add} />
      <Stack.Screen name="Post" component={Post} />
      <Stack.Screen name="Analyze" component={Analyze} />
    </Stack.Navigator>
  );
}
