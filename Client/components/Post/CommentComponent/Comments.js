import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import useComments from "./hooks/useComments";
import useVotes from "./hooks/useVotes";
import useReplies from "./hooks/useReplies";
import CommentItem from "./CommentItem";
import AuthObserver from "../../../utils/AuthObserver";

const API_URL = "http://localhost:8000";

export default function Comments({ postId }) {
  const { comments: initialComments, refreshComments } = useComments(postId);
  const { votes, fetchVoteTotal } = useVotes();
  const { repliesMap, fetchReplies } = useReplies(postId);
  const [comments, setComments] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const id = await AuthObserver.getCurrentUserId();
      setUserId(id);
    };
    fetchUser();
    setComments(initialComments);
  }, [initialComments]);

  const [newComment, setNewComment] = useState("");
  const [showRepliesMap, setShowRepliesMap] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyVisibleMap, setReplyVisibleMap] = useState({});

  const submitNewComment = async () => {
    if (!newComment.trim() || !userId) return;
    
    const body = {
      postId,
      userId,
      text: newComment.trim(),
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      parentId: null,
    };

    try {
      await fetch(`${API_URL}/data/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setNewComment("");
      refreshComments();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const toggleReplies = async (commentId) => {
    setShowRepliesMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    if (!repliesMap[commentId]) {
      const replies = await fetchReplies(commentId);
      replies.forEach((reply) => fetchVoteTotal(reply.commentId));
    }
  };

  const toggleReplyInput = (commentId) => {
    setReplyVisibleMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplyChange = (commentId, text) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: text,
    }));
  };

  const submitReply = async (parentId) => {
    const text = replyInputs[parentId];
    if (!text?.trim() || !userId) return;
    const body = {
      postId,
      userId,
      text,
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      parentId,
    };

    try {
      await fetch(`${API_URL}/data/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const replies = await fetchReplies(parentId);
      replies.forEach((reply) => fetchVoteTotal(reply.commentId));
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      setReplyVisibleMap((prev) => ({ ...prev, [parentId]: false }));
    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Post Comment" onPress={submitNewComment} />
      </View>
  
      <View contentContainerStyle={styles.scrollContent}>
        <View style={styles.commentsContainer}>
          {comments
            .filter((c) => c.parentId === null)
            .map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                userId={userId}
                votes={votes}
                onReplySubmit={submitReply}
                showRepliesMap={showRepliesMap}
                toggleReplies={toggleReplies}
                repliesMap={repliesMap}
                replyVisibleMap={replyVisibleMap}
                toggleReplyInput={toggleReplyInput}
                replyInputs={replyInputs}
                handleReplyChange={handleReplyChange}
                onDelete={(id) =>
                  setComments((prev) => prev.filter((c) => c.commentId !== id))
                }
              />
            ))}
        </View>
      </View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
  },
  commentInputContainer: {
    marginVertical: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    marginVertical: 5,
  },
  commentsContainer: {
    paddingLeft: 20,
  },
});
