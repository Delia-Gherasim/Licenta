import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React, { Component } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchUser } from "../redux/actions";
import AddStack from "./addPhoto/AddStack";
import Feed from "./main/Feed";
import Profile from "./main/Profile";

const Tab = createMaterialTopTabNavigator();
export class Main extends Component {
  componentDidMount() {
    this.props.fetchUser();
  }
  render() {
    //     const {currentUser} = this.props;
    //     if(currentUser == undefined){
    //         return(
    //             <View></View>
    //         )
    //     }
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
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="camera-plus"
                color={color}
                size={26}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-circle"
                color={color}
                size={26}
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
