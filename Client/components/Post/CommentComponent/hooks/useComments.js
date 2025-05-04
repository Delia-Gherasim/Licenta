import { useState, useEffect } from "react";
const API_URL = "http://localhost:8000";

export default function useComments(postId) {
  const [comments, setComments] = useState([]);
  
  const fetchComments = async () => {
    const res = await fetch(`${API_URL}/data/comments/post/${postId}`);
    if (!res.ok) throw new Error("Failed to fetch comments");
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return { comments, refreshComments: fetchComments };
}
