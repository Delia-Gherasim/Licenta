import { useState } from "react";

const API_URL = "http://localhost:8000";

export default function useVotes() {
  const [votes, setVotes] = useState({});

  const fetchVoteTotal = async (commentId) => {
    try {
      const res = await fetch(`${API_URL}/data/votes/${commentId}/total`);
      const data = await res.json();
      setVotes((prev) => ({ ...prev, [commentId]: data.total }));
    } catch (err) {
      console.error("Failed to fetch vote total:", err);
    }
  };

  return { votes, fetchVoteTotal };
}
