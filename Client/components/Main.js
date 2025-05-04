import React, { Component } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AddStack from "./addPhoto/AddStack";
import Feed from "./Feed/Feed";
import ProfileStack from "./profile/ProfileStack";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import AnotherProfile from "./profile/AnotherProfile";

const Tab = createMaterialTopTabNavigator();

export default class Main extends Component {
  
  render() {
    console.log("MAIN"); 
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#6200ea" },
          tabBarLabelStyle: { color: "white" },
          tabBarIndicatorStyle: { backgroundColor: "white" },
        }}
      >
        
        <Tab.Screen
          name="Feed"
          component={Feed}
          options={{
            tabBarLabel: ({ color }) => (
              <MaterialCommunityIcons name="home" color={color} size={24} />
            ),
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddStack}
          options={{
            tabBarLabel: ({ color }) => (
              <MaterialCommunityIcons
                name="camera-plus"
                color={color}
                size={24}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarLabel: ({ color }) => (
              <MaterialCommunityIcons
                name="account-circle"
                color={color}
                size={24}
              />
            ),
          }}
        />
       
      </Tab.Navigator>
    );
  }
}
