import { useState } from "react";

const API_URL = "http://localhost:8000";

export default function useReplies(postId) {
  const [repliesMap, setRepliesMap] = useState({});

  const fetchReplies = async (parentCommentId) => {
    try {
      const res = await fetch(
        `${API_URL}/data/comments/post/${postId}/comment/${parentCommentId}`
      );
      const data = await res.json();
      setRepliesMap((prev) => ({
        ...prev,
        [parentCommentId]: data.replies,
      }));
      return data.replies;
    } catch (error) {
      console.error("Failed to load replies:", error);
      return [];
    }
  };

  return { repliesMap, fetchReplies };
}
