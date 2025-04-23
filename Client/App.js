import React, { Component } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import Landing from "./components/auth/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Main from "./components/Main";

import rootReducer from "./redux/reducers";

const firebaseConfig = {
  apiKey: "AIzaSyCUBmFQPFFsZGZtcBYnRjTJLpg2k4MEl1Q",
  authDomain: "photoadvice-3724b.firebaseapp.com",
  projectId: "photoadvice-3724b",
  storageBucket: "photoadvice-3724b.appspot.com",
  messagingSenderId: "398427724040",
  appId: "1:398427724040:web:b827a2506f7ed5c633b4bd",
  measurementId: "G-2CZBLCMB26",
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const Stack = createStackNavigator();
const store = createStore(rootReducer, applyMiddleware(thunk));

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      loggedIn: false,
    };
  }

  componentDidMount() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      this.setState({
        loggedIn: !!user,
        loaded: true,
      });
    });
  }

  render() {
    const { loaded, loggedIn } = this.state;

    if (!loaded) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Loading...</Text>
        </View>
      );
    }

    if (!loggedIn) {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Landing">
            <Stack.Screen
              name="Landing"
              component={Landing}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Login" component={Login} />{" "}
            {/* ← Add Login screen */}
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    return (
      <Provider store={store}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen
              name="Main"
              component={Main}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    );
  }
}

export default App;
