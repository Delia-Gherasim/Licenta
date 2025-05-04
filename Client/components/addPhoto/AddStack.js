import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import Add from "./Add";
import Analyze from "./Analyze";
import Publish from "./Publish";

const Stack = createStackNavigator();

export default function AddStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AddMain" component={Add} />
      <Stack.Screen name="Publish" component={Publish} />
      <Stack.Screen name="Analyze" component={Analyze} />
    </Stack.Navigator>
  );
}
