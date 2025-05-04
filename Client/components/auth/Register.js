import React, { Component } from "react";
import {
  Alert,
  Button,
  TextInput,
  View,
  StyleSheet,
  ScrollView, 
} from "react-native";
import AuthObserver from "../../utils/AuthObserver";
export class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      RePassword: "",
      name: "",
      bio: "",
    };
    this.onSignUp = this.onSignUp.bind(this);
  }

  async onSignUp() {
    const { email, password, RePassword, name, bio } = this.state;
  
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
  
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
  
    if (password !== RePassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
  
    try {
      await AuthObserver.register({ email, password, name, bio });
      Alert.alert("Success", "User registered successfully!");
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Failed", error.message);
    }
  }
  
  

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          placeholder="Name"
          style={styles.input}
          onChangeText={(name) => this.setState({ name })}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email) => this.setState({ email })}
        />
        <TextInput
          placeholder="Bio"
          style={styles.input}
          onChangeText={(bio) => this.setState({ bio })}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry={true}
          onChangeText={(password) => this.setState({ password })}
        />
        <TextInput
          placeholder="Repeat Password"
          style={styles.input}
          secureTextEntry={true}
          onChangeText={(RePassword) => this.setState({ RePassword })}
        />
        <View style={styles.buttonContainer}>
          <Button onPress={this.onSignUp} title="Sign Up" color="#6200ea" />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default Register;
