import React, { createContext, useContext, useState, useEffect } from "react";
import { subscribe } from "./utils/EventBus";
import Toast from "react-native-toast-message";
import { Image, View, Text, StyleSheet } from "react-native";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({ message, thumbnail }) => {
    const newNotif = {
      id: Date.now(),
      message,
      thumbnail, 
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    Toast.show({
      type: "info",
      text1: "🔔 New Notification",
      text2: (
        <View style={styles.toastContent}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          ) : null}
          <Text>{message}</Text>
        </View>
      ),
      position: "top",
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 40,
    });
  };

  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    const unsubscribe = subscribe("notifyUser", (payload) => {
      addNotification({ message: payload.message, thumbnail: payload.thumbnail });
    });
    return () => unsubscribe();
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, clearNotifications }}
    >
      {children}
      <Toast />
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
});
