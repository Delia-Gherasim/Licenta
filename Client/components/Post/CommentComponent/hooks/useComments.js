import { useState, useEffect } from "react";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;

export default function useComments(postId) {
  const [comments, setComments] = useState([]);
  
  const fetchComments = async () => {
    const res = await fetch(`${API_URL}/comments/post/${postId}`);
    if (!res.ok) throw new Error("Failed to fetch comments");
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return { comments, refreshComments: fetchComments };
}
