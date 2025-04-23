import React, { useState, useEffect } from "react";
import { View, Text, Button, TextInput, Platform } from "react-native";

export default function Comments({ postId, userId }) {
  const [comments, setComments] = useState([]);
  const [showRepliesMap, setShowRepliesMap] = useState({});
  const [repliesMap, setRepliesMap] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyVisibleMap, setReplyVisibleMap] = useState({});

  const API_URL =
    Platform.OS === "web"
      ? "https://your-api-domain.com"
      : "http://localhost:8000";

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_URL}/data/comments/post/${postId}`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("Failed to load comments:", error);
      }
    };

    fetchComments();
  }, [postId]);

  const fetchReplies = async (parentCommentId) => {
    try {
      const res = await fetch(
        `${API_URL}/data/comments/post/${postId}/comment/${parentCommentId}`
      );
      const data = await res.json();
      setRepliesMap((prevReplies) => ({
        ...prevReplies,
        [parentCommentId]: {
          mainComment: data.mainComment,
          replies: data.replies,
        },
      }));
    } catch (error) {
      console.error("Failed to load replies:", error);
    }
  };

  const toggleReplies = (commentId) => {
    setShowRepliesMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    if (!repliesMap[commentId]) {
      fetchReplies(commentId);
    }
  };

  const handleVote = async (commentId) => {
    try {
      await fetch(`${API_URL}/data/votes/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: commentId,
          userId: userId,
          vote: true,
        }),
      });
      // Re-fetch or optimistically update likes count
    } catch (error) {
      console.error("Failed to vote:", error);
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
    if (!text?.trim()) return;

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
      fetchReplies(parentId); // Refresh replies
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      setReplyVisibleMap((prev) => ({ ...prev, [parentId]: false }));
    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  const renderReplies = (parentId) => {
    const replies = repliesMap[parentId]?.replies || [];

    return replies.map((reply) => (
      <View key={reply.commentId} style={{ marginLeft: 20, marginVertical: 5 }}>
        <Text>
          {reply.userId} - {reply.text}
        </Text>
        <Text>{new Date(reply.date).toLocaleString()}</Text>
        <Text>Likes: {reply.likes}</Text>
        <Button title="Like" onPress={() => handleVote(reply.commentId)} />
        <Button
          title="Reply"
          onPress={() => toggleReplyInput(reply.commentId)}
        />

        {replyVisibleMap[reply.commentId] && (
          <View>
            <TextInput
              placeholder="Write your reply..."
              value={replyInputs[reply.commentId] || ""}
              onChangeText={(text) => handleReplyChange(reply.commentId, text)}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 5,
                marginVertical: 5,
              }}
            />
            <Button
              title="Submit Reply"
              onPress={() => submitReply(reply.commentId)}
            />
          </View>
        )}
      </View>
    ));
  };

  const topLevelComments = comments.filter((c) => c.parentId === null);

  return (
    <View>
      {topLevelComments.map((comment) => (
        <View key={comment.commentId} style={{ marginVertical: 10 }}>
          <Text>
            {comment.userId} - {comment.text}
          </Text>
          <Text>{new Date(comment.date).toLocaleString()}</Text>
          <Text>Likes: {comment.likes}</Text>

          <Button title="Like" onPress={() => handleVote(comment.commentId)} />
          <Button
            title="Reply"
            onPress={() => toggleReplyInput(comment.commentId)}
          />

          {replyVisibleMap[comment.commentId] && (
            <View>
              <TextInput
                placeholder="Write your reply..."
                value={replyInputs[comment.commentId] || ""}
                onChangeText={(text) =>
                  handleReplyChange(comment.commentId, text)
                }
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 5,
                  marginVertical: 5,
                }}
              />
              <Button
                title="Submit Reply"
                onPress={() => submitReply(comment.commentId)}
              />
            </View>
          )}

          {comment.hasReplies && (
            <Button
              title={
                showRepliesMap[comment.commentId] ? "Hide Replies" : "SEE MORE"
              }
              onPress={() => toggleReplies(comment.commentId)}
            />
          )}
          {showRepliesMap[comment.commentId] &&
            renderReplies(comment.commentId)}
        </View>
      ))}
    </View>
  );
}
