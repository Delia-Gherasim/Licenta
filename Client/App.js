import React, { Component } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Toast from 'react-native-toast-message';

import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Landing from "./components/auth/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Main from "./components/Main";
import AuthObserver from "./utils/AuthObserver";
import { NotificationProvider } from "./NotificationContext";


const Stack = createStackNavigator();

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      loggedIn: false,
    };
  }

  componentDidMount() {
    AuthObserver.init();
    AuthObserver.subscribe((user) => {
      this.setState({
        loggedIn: !!user,
        loaded: true,
      });
    });
  }

  componentWillUnmount() {
    AuthObserver.cleanup();
  }

  render() {
    const { loaded, loggedIn } = this.state;

    if (!loaded) {
      return (
        <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#E0E0E2",
        }}
        >
          <Text>Loading...</Text>
        </View>
      );
    }

    return (
      <>
      <NotificationProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={loggedIn ? "Main" : "Landing"}>
          {!loggedIn ? (
            <>
              <Stack.Screen name="Landing" component={Landing} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Login" component={Login} />
            </>
          ) : (
            <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} style={{ flex: 1 }}/>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
      </NotificationProvider>
      </>
    );
  }
}

export default App;
