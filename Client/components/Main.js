import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchUser } from "../redux/actions";
import AddStack from "./addPhoto/AddStack";
import Feed from "./Feed/Feed";
import Profile from "./main/Profile";
import { MaterialCommunityIcons } from "react-native-vector-icons";

const Tab = createMaterialTopTabNavigator();

export class Main extends Component {
  componentDidMount() {
    this.props.fetchUser();
  }

  render() {
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
          component={Profile}
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

const mapStateToProps = (store) => ({
  currentUser: store.userState.currentUser,
});

const mapDispatchProps = (dispatch) =>
  bindActionCreators({ fetchUser }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Main);
