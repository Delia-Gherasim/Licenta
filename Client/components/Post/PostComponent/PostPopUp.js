import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import PostDetails from "./PostDetails";

export default function PostPopUp({ post, userId, visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <PostDetails post={post} userId={userId} showClose onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    overflow: "hidden", 
  }
});
