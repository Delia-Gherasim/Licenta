import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk';

import { Provider } from 'react-redux';
import Landing from './components/auth/Landing';
import Register from './components/auth/Register';
import Main from './components/Main';
import rootReducer from './redux/reducers';


// 🔐 Move this to environment variables for security!
const firebaseConfig = {
  apiKey: "AIzaSyCUBmFQPFFsZGZtcBYnRjTJLpg2k4MEl1Q",
  authDomain: "photoadvice-3724b.firebaseapp.com",
  projectId: "photoadvice-3724b",
  storageBucket: "photoadvice-3724b.firebasestorage.app",
  messagingSenderId: "398427724040",
  appId: "1:398427724040:web:b827a2506f7ed5c633b4bd",
  measurementId: "G-2CZBLCMB26"
}; 

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const Stack = createStackNavigator();

const store = createStore(rootReducer, applyMiddleware(thunk))

export class App extends Component {
  constructor(props){
    super(props);
    this.state={
      loggedIn: false,
      loaded: false,
    }
  }
  componentDidMount(){
    const auth = getAuth(); 
    onAuthStateChanged(auth, (user) => { 
      if (user) {
        this.setState({ loggedIn: true, loaded: true });
      } else {
        this.setState({ loggedIn: false, loaded: true });
      }
    });
  }
  render() {
    const {loggedIn, loaded} = this.state;
    if(!loaded){
      return(
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Text>Loading</Text>
        </View>
      )
    }
    if(!loggedIn){
      return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={Landing} options={{headerShown: false}} />
          <Stack.Screen name="Register" component={Register}/>
        </Stack.Navigator>
      </NavigationContainer>
      )
    }
    return(
      <Provider store={store}>
        <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Main" component={Main} options={{headerShown: false}} />
        
        </Stack.Navigator> 
        </NavigationContainer>
      </Provider>
    )
    
  }
}

export default App


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
