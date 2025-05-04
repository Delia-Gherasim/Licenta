import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import VoteButtons from "../VoteButtons";
import ReplyInput from "./ReplyInput";

const API_URL = "http://localhost:8000";

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

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/data/users/${userId}`);
      const data = await response.json();
      setUserName(data.name); 
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API_URL}/data/comments/${commentId}`, {
        method: "DELETE",
      });
      onDelete(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };
  useEffect(() => {
    if (comment.userId) {
      fetchUserData(comment.userId);
    }
  }, [comment.userId]);
  return (
    <View key={commentId} style={styles.commentContainer}>
      {userName ? <Text>{userName}</Text> : null}
      <Text>{comment.text}</Text>
      <Text>{new Date(comment.date).toLocaleString()}</Text>

      <VoteButtons commentId={comment.commentId} userId={userId} />

      <Button title="Reply" onPress={() => toggleReplyInput(commentId)} />
      {replyInputVisible && (
        <ReplyInput
          value={replyInputValue}
          onChange={(text) => handleReplyChange(commentId, text)}
          onSubmit={() => onReplySubmit(commentId)}
        />
      )}

      {comment.hasReplies && (
        <Button
          title={showReplies ? "Hide Replies" : "Show Replies"}
          onPress={() => toggleReplies(commentId)}
        />
      )}

      {userId === comment.userId && (
        <Button title="Delete" color="red" onPress={handleDelete} />
      )}

      {showReplies &&
        replies.map((reply) => (
          <CommentItem
            key={reply.commentId}
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
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
});

export default CommentItem;
