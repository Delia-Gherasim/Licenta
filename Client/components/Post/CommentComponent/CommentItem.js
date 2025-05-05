import React, { useState, useEffect } from "react";  
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import VoteButtons from "../VoteButtons";
import ReplyInput from "./ReplyInput";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;

const CommentItem = ({
  comment,
  userId,
  votes,
  onReplySubmit,
  showRepliesMap,
  toggleReplies,
  repliesMap,
  replyVisibleMap,
  toggleReplyInput,
  replyInputs,
  handleReplyChange,
  onDelete,
}) => {
  const commentId = comment.commentId;
  const voteCount = votes[commentId] ?? 0;
  const showReplies = showRepliesMap[commentId];
  const replyInputVisible = replyVisibleMap[commentId];
  const replyInputValue = replyInputs[commentId] || "";
  const replies = repliesMap[commentId] || [];
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (comment.userId) {
      fetchUserData(comment.userId);
    }
  }, [comment.userId]);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`);
      const data = await response.json();
      setUserName(data.name);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_URL}/comments/${commentId}`, {
        method: "DELETE",
      });
      onDelete(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <View key={commentId} style={styles.commentContainer}>
      <View style={styles.header}>
        <Text style={styles.userName}>{userName || "User"}</Text>
        <Text style={styles.commentDate}>
          {new Date(comment.date).toLocaleString()}
        </Text>
      </View>

      <Text style={styles.commentText}>{comment.text}</Text>

      <View style={styles.voteAndReplyContainer}>
        <VoteButtons commentId={comment.commentId} />

        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => toggleReplyInput(commentId)}
        >
          <Text style={styles.buttonText}>Reply</Text>
        </TouchableOpacity>

        {userId === comment.userId && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {replyInputVisible && (
        <ReplyInput
          value={replyInputValue}
          onChange={(text) => handleReplyChange(commentId, text)}
          onSubmit={() => onReplySubmit(commentId)}
        />
      )}

      {comment.hasReplies && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => toggleReplies(commentId)}
        >
          <Text style={styles.buttonText}>
            {showReplies ? "Hide Replies" : "Show Replies"}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies &&
        replies.map((reply) => (
          <View key={reply.commentId} style={styles.replyContainer}>
            <CommentItem
              comment={reply}
              userId={userId}
              votes={votes}
              onReplySubmit={onReplySubmit}
              showRepliesMap={showRepliesMap}
              toggleReplies={toggleReplies}
              repliesMap={repliesMap}
              replyVisibleMap={replyVisibleMap}
              toggleReplyInput={toggleReplyInput}
              replyInputs={replyInputs}
              handleReplyChange={handleReplyChange}
              onDelete={onDelete}
            />
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    marginLeft: 8,
    marginRight: 8,
    shadowColor: "#000004",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  userName: {
    fontWeight: "bold",
    color: "#231123",
  },
  commentDate: {
    fontSize: 12,
    color: "#555",
    alignSelf: "flex-start",
  },
  commentText: {
    fontSize: 18,
    color: "#231123",
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: "500", 
  },
  button: {
    backgroundColor: "#372554",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
  voteAndReplyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", 
    marginTop: 8,
  },
  replyButton: {
    backgroundColor: "#372554",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: "auto", 
  },
  deleteButton: {
    backgroundColor: "#A93226",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10, 
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  replyContainer: {
    paddingLeft: 20, 
    marginTop: 8,
  },
});

export default CommentItem;
