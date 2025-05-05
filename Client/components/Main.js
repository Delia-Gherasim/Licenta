import React, { Component } from "react";
import { View, StyleSheet, Platform, SafeAreaView } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AddStack from "./addPhoto/AddStack";
import Feed from "./Feed/Feed";
import ProfileStack from "./profile/ProfileStack";
import { MaterialCommunityIcons } from "react-native-vector-icons";

const Tab = createMaterialTopTabNavigator();

export default class Main extends Component {
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: "#7389AE",
            },
            tabBarLabelStyle: {
              color: "#372554",
            },
            tabBarIndicatorStyle: {
              backgroundColor: "#372554",
            },
          }}
        >
          <Tab.Screen
            name="Feed"
            component={Feed}
            options={{
              tabBarLabel: ({ color }) => (
                <MaterialCommunityIcons name="home" color={color} size={24} />
              ),
              headerLeft: () => (
                navigation.canGoBack() ? (
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={30}
                    color="#372554"
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 15 }}
                  />
                ) : null
              )
              
            }}
          />
          <Tab.Screen
            name="Add"
            component={AddStack}
            options={{
              tabBarLabel: ({ color }) => (
                <MaterialCommunityIcons name="camera-plus" color={color} size={24} />
              ),
              headerLeft: () => (
                navigation.canGoBack() ? (
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={30}
                    color="#372554"
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 15 }}
                  />
                ) : null
              )
              
            }}
          />
          <Tab.Screen
            name="ProfileStack"
            component={ProfileStack}
            options={{
              tabBarLabel: ({ color }) => (
                <MaterialCommunityIcons name="account-circle" color={color} size={24} />
              ),
              headerLeft: () => (
                navigation.canGoBack() ? (
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={30}
                    color="#372554"
                    onPress={() => navigation.goBack()}
                    style={{ marginLeft: 15 }}
                  />
                ) : null
              )
              
            }}
          />
        </Tab.Navigator>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0E0E2",
    paddingTop: Platform.OS === "android" ? 25 : 0, 
  },
});
