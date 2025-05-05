import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Dimensions,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../../NotificationContext";
import { ScrollView } from "react-native-gesture-handler";

const screenHeight = Dimensions.get("window").height;

const Notifications = () => {
  const { notifications, clearNotifications } = useNotifications();
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#372554" />
        </Pressable>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Your Notifications</Text>
        <Button title="Clear All" onPress={clearNotifications} />
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
        />
      </View>
          <View style={{ height: 80}} />
    </ScrollView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  scrollContent: {
    height: screenHeight,
    backgroundColor: "#e0e0e2",
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  message: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
