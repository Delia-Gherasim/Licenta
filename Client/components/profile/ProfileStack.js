import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import UserListScreen from "./UserListScreen";
import UserProfile from "./UserProfile";
import Settings from "./Settings";
import AnotherProfile from "./AnotherProfile";
import Notifications from "./Notifications";
const Stack = createStackNavigator();

export default function ProfileStack() {     
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={UserProfile} />
      <Stack.Screen name="List" component={UserListScreen} />
      <Stack.Screen name="Settings" component={Settings}style={{ flex: 1 }} />
      <Stack.Screen name="AnotherProfile" component={AnotherProfile} />
      <Stack.Screen name="Notification" component={Notifications}/>
    </Stack.Navigator>
  );
}
