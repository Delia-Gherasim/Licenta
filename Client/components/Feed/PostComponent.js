import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { Rating } from "react-native-elements";

export default function PostComponent({ post }) {
  return (
    <View style={styles.postContainer}>
      <Text style={styles.caption}>{post.caption}</Text>
      <Image source={{ uri: post.url }} style={styles.image} />
      <Text>Date: {new Date(post.date).toLocaleDateString()}</Text>
      <Text>Views: {post.views}</Text>
      <View style={styles.ratingContainer}>
        <Text>Rating:</Text>
        <Rating
          imageSize={20}
          readonly
          startingValue={post.rating}
          style={styles.rating}
        />
      </View>
      <Text>Hashtags: {post.hashtags.join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    width: Platform.OS === "web" ? "80%" : "100%", // Web width may need to be adjusted
    alignSelf: "center", // Center content in web, might need adjusting in mobile
  },
  caption: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "cover", // Make sure the image is properly scaled
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rating: {
    marginLeft: 5,
  },
});
