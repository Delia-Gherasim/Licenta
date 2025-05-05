import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

const ReplyInput = ({ onSubmit, value, onChange }) => (
  <View style={styles.inputContainer}>
    <TextInput
      placeholder="Write your reply..."
      value={value}
      onChangeText={onChange}
      style={styles.replyInput}
    />
    <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
      <Text style={styles.submitButtonText}>Submit</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#372554",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ReplyInput;
