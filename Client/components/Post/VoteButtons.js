import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const VoteButtons = ({ commentId, userId }) => {
  const [userVote, setUserVote] = useState(null); // 'like', 'dislike', or null
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    // Fetch user's vote
    fetch(`http://localhost:8000/data/votes/${commentId}/user/${userId}`)
      .then(res => res.json())
      .then(data => setUserVote(data.vote))
      .catch(err => console.error(err));

    // Fetch total votes
    fetch(`http://localhost:8000/data/votes/${commentId}/total`)
      .then(res => res.json())
      .then(data => setTotalVotes(data.total))
      .catch(err => console.error(err));
  }, [commentId, userId]);

  const handleVote = (vote) => {
    fetch(`http://localhost:8000/data/votes/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, userId, vote }),
    })
      .then(() => {
        setUserVote(vote ? 'like' : 'dislike');
        // Optionally, update totalVotes here
      })
      .catch(err => console.error(err));
  };

  return (
    <View style={styles.voteContainer}>
      <Button
        title="Like"
        onPress={() => handleVote(true)}
        color={userVote === 'like' ? 'green' : 'gray'}
      />
      <Button
        title="Dislike"
        onPress={() => handleVote(false)}
        color={userVote === 'dislike' ? 'red' : 'gray'}
      />
      <Text>Total Votes: {totalVotes}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default VoteButtons;
