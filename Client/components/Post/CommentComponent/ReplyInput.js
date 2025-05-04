import React, { useState, useEffect } from "react";
import { View, Text, Button, TextInput, StyleSheet, ScrollView, } from "react-native";

const API_URL = "http://localhost:8000";

const ReplyInput = ({ onSubmit, value, onChange }) => (
  <View>
    <TextInput
      placeholder="Write your reply..."
      value={value}
      onChangeText={onChange}
      style={styles.replyInput}
    />
    <Button title="Submit Reply" onPress={onSubmit} />
  </View>
);
const styles = StyleSheet.create({
    replyInput: {
      borderWidth: 1,
      borderColor: "#ccc",
      padding: 8,
      marginVertical: 5,
      borderRadius: 6,
    },
  });
  
export default ReplyInput