import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { Component } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';

export class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            RePassword: '',
            name: '',
            bio: ''
        };
        this.onSignUp = this.onSignUp.bind(this);
    }

    async onSignUp() {
        const { email, password, RePassword, name, bio } = this.state;
        const auth = getAuth(); 
        const db = getFirestore();

        if (password !== RePassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                bio,
                postRating: 0,
                commentsRating : 0,
                followers: [],
                following: []
            });

            console.log('User created:', user);
        } catch (error) {
            console.error('Error signing up:', error);
            Alert.alert("Sign Up Error", error.message);
        }
    }

    render() {
        return (
            <View>
                <TextInput placeholder="Name" onChangeText={(name) => this.setState({ name })} />
                <TextInput placeholder="Email" onChangeText={(email) => this.setState({ email })} />
                <TextInput placeholder="Bio" onChangeText={(bio) => this.setState({ bio })} />
                <TextInput placeholder="Password" secureTextEntry={true} onChangeText={(password) => this.setState({ password })} />
                <TextInput placeholder="Repeat Password" secureTextEntry={true} onChangeText={(RePassword) => this.setState({ RePassword })} />
                <Button onPress={this.onSignUp} title="Sign Up" />
            </View>
        );
    }
}

export default Register;
