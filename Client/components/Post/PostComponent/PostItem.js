import React from "react";
import { View, StyleSheet } from "react-native";
import PostDetails from "./PostDetails";

export default function PostItem({ post, userId }) {
  return (
    <View style={styles.itemContainer}>
      <PostDetails post={post} userId={userId} />
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
});
