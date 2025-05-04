import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
} from "react-native";

const extractHashtags = (caption) => {
  const matches = caption.match(/#\w+/g);
  return matches ? matches.map((tag) => tag.slice(1)) : [];
};

export default function PostSettingsModal({
  visible,
  onClose,
  post,
  currentUserId,
  onPostUpdated,
  onPostDeleted,
}) {
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleUpdate = async () => {
    const updatedHashtags = extractHashtags(editedCaption);
  
    const body = {
      user_id: currentUserId,
      caption: editedCaption,
      date: post.date,
      rating: post.rating,
      url: post.url,
      views: post.views,
      hashtags: updatedHashtags,
    };
  
    try {
      const res = await fetch(`http://localhost:8000/data/posts/${post.postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      if (!res.ok) throw new Error("Failed to update post");
      setSuccessMessage("Post updated successfully!");
      onPostUpdated?.();
      onClose();
    } catch (err) {
      const errorMessage = err.message || JSON.stringify(err); 
      setErrorMessage(errorMessage);
    }
  };
  
  const handleDelete = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/data/posts/${post.postId}/${currentUserId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete post");
      setSuccessMessage("Your post has been removed.");
      onPostDeleted?.();
      onClose();
    } catch (err) {
      const errorMessage = err.message || JSON.stringify(err); 
      setErrorMessage(errorMessage);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Edit Post</Text>
          <TextInput
            style={styles.input}
            multiline
            value={editedCaption}
            onChangeText={setEditedCaption}
            placeholder="Update caption with hashtags"
          />
          <View style={styles.buttonRow}>
            <Button title="Save" onPress={handleUpdate} />
            <Button title="Cancel" color="gray" onPress={onClose} />
          </View>
          <View style={styles.deleteButton}>
            <Button title="Delete Post" color="red" onPress={handleDelete} />
          </View>
        </View>
      </View>

      {/* Success Message Modal */}
      {successMessage && (
        <Modal
          visible={!!successMessage}
          animationType="fade"
          transparent
          onRequestClose={() => setSuccessMessage(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.messageModal}>
              <Text>{successMessage}</Text>
              <Button title="OK" onPress={() => setSuccessMessage(null)} />
            </View>
          </View>
        </Modal>
      )}

      {/* Error Message Modal */}
      {errorMessage && (
        <Modal
          visible={!!errorMessage}
          animationType="fade"
          transparent
          onRequestClose={() => setErrorMessage(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.messageModal}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="OK" onPress={() => setErrorMessage(null)} />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  messageModal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  deleteButton: {
    marginTop: 10,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});
