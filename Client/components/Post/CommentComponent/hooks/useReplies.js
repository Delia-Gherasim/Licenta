import { useState } from "react";
import Constants from 'expo-constants';
import authorizedFetch from "../../../../utils/authorizedFetch";
const API_URL = Constants.expoConfig.extra.API_URL_DATA;

export default function useReplies(postId) {
  const [repliesMap, setRepliesMap] = useState({});

  const fetchReplies = async (parentCommentId) => {
    try {
      const res = await authorizedFetch(
        `${API_URL}/comments/post/${postId}/comment/${parentCommentId}`
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
