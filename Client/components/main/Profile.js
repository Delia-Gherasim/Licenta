import { getAuth } from 'firebase/auth';
import React from "react";
import { Button, Text, View } from "react-native";
export default function Profile() {
  const onLogOut = () =>{
    const auth = getAuth(); 
    auth.signOut();
  }
  return (
    <View>
      <Text></Text>

      <Button title="Log Out" onPress={() => onLogOut()}></Button>
    </View>
  );
}
