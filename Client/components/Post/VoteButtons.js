import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AuthObserver from '../../utils/AuthObserver';
import { useNotifications } from '../../NotificationContext'; 
import Constants from 'expo-constants';
const API_URL = Constants.manifest.extra.API_URL_DATA;
const VoteButtons = ({ commentId }) => {
  const [userVote, setUserVote] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userId, setUserId] = useState(null);
  const [commentOwnerId, setCommentOwnerId] = useState(null);
  const { addNotification } = useNotifications(); 

  useEffect(() => {
    const fetchUser = async () => {
      const id = await AuthObserver.getCurrentUserId();
      setUserId(id);
    };
    fetchUser();
  }, []);

  const fetchVotesData = () => {
    if (!userId) return;

    fetch(`${API_URL}/votes/${commentId}/user/${userId}`)
      .then(res => res.json())
      .then(data => setUserVote(data.vote))
      .catch(err => {
        console.error('Error fetching user vote:', err);
        setUserVote(null);
      });

    fetch(`${API_URL}/votes/${commentId}/total?userId=${userId}`)
      .then(res => res.json())
      .then(data => setTotalVotes(data.total))
      .catch(err => {
        console.error('Error fetching total votes:', err);
        setTotalVotes(0);
      });

    fetch(`${API_URL}/comments/${commentId}`)
      .then(res => res.json())
      .then(data => {
        setCommentOwnerId(data.userId);
      })
      .catch(err => console.error('Error fetching comment owner:', err));
  };

  useEffect(() => {
    if (userId) {
      fetchVotesData();
    }
  }, [userId, commentId]);

  const handleVote = (vote) => {
    if (!userId) return;

    if (userVote === vote) {
      fetch(`${API_URL}/votes/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Remove vote failed');
          return res.json();
        })
        .then(data => {
          setUserVote(null);
          if (data.totalLikes && typeof data.totalLikes.totalVotes === 'number') {
            setTotalVotes(data.totalLikes.totalVotes);
          }
        })
        .catch(err => console.error('Error removing vote:', err));
    } else {
      fetch(`${API_URL}/votes/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId, vote }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Vote failed');
          return res.json();
        })
        .then(data => {
          setUserVote(vote);
          if (data.totalLikes && typeof data.totalLikes.totalVotes === 'number') {
            setTotalVotes(data.totalLikes.totalVotes);
          }

          if (commentOwnerId && userId !== commentOwnerId) {
            AuthObserver.fetchUserProfile(userId) 
              .then(username => {
                const message = `${username} voted ${vote ? "like" : "dislike"} on your comment!`;
                addNotification({ message });  
              });
          }
        })
        .catch(err => console.error('Error posting vote:', err));
    }
  };

  return (
    <View style={styles.voteContainer}>
      <TouchableOpacity onPress={() => handleVote(true)} style={styles.voteButton}>
        <Icon
          name="arrow-up"
          size={24}
          color={userVote === true ? '#81D2C7' : 'gray'} 
          style={styles.voteIcon}
        />
      </TouchableOpacity>

      {totalVotes > 0 && <Text style={styles.voteText}>{totalVotes}</Text>}

      <TouchableOpacity onPress={() => handleVote(false)} style={styles.voteButton}>
        <Icon
          name="arrow-down"
          size={24}
          color={userVote === false ? '#B2675E' : 'gray'} 
          style={styles.voteIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 15,
  },
  voteButton: {
    padding: 8,
  },
  voteIcon: {
    marginHorizontal: 10,
  },
  voteText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#231123',
  },
});

export default VoteButtons;
