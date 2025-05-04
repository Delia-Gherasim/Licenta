import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import UserListScreen from "./UserListScreen";
import UserProfile from "./UserProfile";
import Settings from "./Settings";
import AnotherProfile from "./AnotherProfile";
const Stack = createStackNavigator();

export default function ProfileStack() {      console.log("USER STACK")
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Profile" component={UserProfile} />
      <Stack.Screen name="List" component={UserListScreen} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="AnotherProfile" component={AnotherProfile} />
    </Stack.Navigator>
  );
}
