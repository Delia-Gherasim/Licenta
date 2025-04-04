import { getAuth } from 'firebase/auth';
import React, { Component } from 'react';
import { Button, TextInput, View } from 'react-native';

export class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            name: ''
        };
        this.onSignUp = this.onSignIn.bind(this);
    }

    onSignIn() {
        const { email, password, name } = this.state;
        const auth = getAuth(); 

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('User created:', userCredential.user);
            })
            .catch((error) => {
                console.error('Error signing up:', error);
            });
    }

    render() {
        return (
            <View>
                <TextInput placeholder="name" onChangeText={(name) => this.setState({ name })} />
                <TextInput placeholder="email" onChangeText={(email) => this.setState({ email })} />
                <TextInput placeholder="password" secureTextEntry={true} onChangeText={(password) => this.setState({ password })} />
                <Button onPress={this.onSignIn} title="Sign In" />
            </View>
        );
    }
}

export default Register;
