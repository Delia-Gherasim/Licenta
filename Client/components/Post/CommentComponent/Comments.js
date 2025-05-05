import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import useComments from "./hooks/useComments";
import useVotes from "./hooks/useVotes";
import useReplies from "./hooks/useReplies";
import CommentItem from "./CommentItem";
import AuthObserver from "../../../utils/AuthObserver";
import { emit } from "../../../utils/EventBus";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;

export default function Comments({ postId }) {
  const { comments: initialComments, refreshComments } = useComments(postId);
  const { votes, fetchVoteTotal } = useVotes();
  const { repliesMap, fetchReplies } = useReplies(postId);
  const [comments, setComments] = useState([]);
  const [userId, setUserId] = useState(null);
  const [postOwnerId, setPostOwnerId] = useState(null);


  useEffect(() => {
    const fetchUser = async () => {
      const id = await AuthObserver.getCurrentUserId();
      setUserId(id);
    };
    fetchUser();
    setComments(initialComments);
  }, [initialComments, postId]);

  useEffect(() => {
    const fetchPostOwner = async () => {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        const postData = await response.json();
        setPostOwnerId(postData.userId); 
      } catch (error) {
        console.error("Error fetching post owner:", error);
      }
    };
    if (postId) {
      fetchPostOwner();
    }
  }, [postId]);

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
      await fetch(`${API_URL}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      refreshComments();
      setNewComment("");
      if (postOwnerId !== userId) {
        const userName = await AuthObserver.fetchUserName(userId);
        const message = `${userName} commented on your post!`;
        emit("notifyUser", { message });
      }
      
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
      await fetch(`${API_URL}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const updatedReplies = await fetchReplies(parentId);
      setShowRepliesMap((prev) => ({
        ...prev,
        [parentId]: true, 
      }));
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      setReplyVisibleMap((prev) => ({ ...prev, [parentId]: false }));

      const commentOwnerId = updatedReplies[0]?.userId; 
      if (commentOwnerId) {
        if (commentOwnerId != userId){
        const userName = await AuthObserver.fetchUserName(userId);
        const message = `${userName} replied to your comment!`;
        emit("notifyUser", { message }); }
      }
      fetchReplies(parentId); 

    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <Button title="Post" onPress={submitNewComment} />
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    flexGrow: 1,
  },
  commentInputContainer: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  replyInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 5,
    marginRight: 10,
    borderRadius: 5,
    textAlignVertical: "top",
  },
  commentsContainer: {
    paddingLeft: 20,
    flexGrow: 1,
  },
});
