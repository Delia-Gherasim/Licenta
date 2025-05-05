import { useState } from "react";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;

export default function useVotes() {
  const [votes, setVotes] = useState({});

  const fetchVoteTotal = async (commentId) => {
    try {
      const res = await fetch(`${API_URL}/votes/${commentId}/total`);
      const data = await res.json();
      setVotes((prev) => ({ ...prev, [commentId]: data.total }));
    } catch (err) {
      console.error("Failed to fetch vote total:", err);
    }
  };

  return { votes, fetchVoteTotal };
}
