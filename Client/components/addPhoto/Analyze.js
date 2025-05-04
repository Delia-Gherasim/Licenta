import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { uploadToCloudinary } from "../../utils/CloudinaryConfig";
import * as FileSystem from "expo-file-system";
import * as mime from 'mime-types';

// Import the TextResponse class
import TextResponse from "./TextResponse";

export default function Analyze({ route }) {
  const { imageUri } = route.params;
  const navigation = useNavigation();

  const [options, setOptions] = useState([]);
  const [subOptions, setSubOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showCameraAnimation, setShowCameraAnimation] = useState(false);
  const scrollViewRef = useRef();

  const API_URL = "http://localhost:8000/chatbot";

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowCameraAnimation(true), 3000);
    } else {
      setShowCameraAnimation(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_URL}/`);
      const data = await res.json();
      setOptions(data.options);
      addMessage("bot", "Hi there! What kind of advice are you looking for?");
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  };

  const fetchSubOptions = async (mainChoice) => {
    try {
      const res = await fetch(
        `${API_URL}/sub_options?main_choice=${mainChoice}`
      );
      const data = await res.json();
      setSubOptions(data.sub_options);
      if (data.sub_options.length > 0) {
        addMessage(
          "bot",
          `Got it! What kind of ${mainChoice.replace("_", " ")} advice do you want?`
        );
      } else {
        submitAdvice(mainChoice, null);
      }
    } catch (err) {
      console.error("Failed to fetch sub options:", err);
    }
  };

  const submitAdvice = async (choice, sub_choice) => {
    try {
      // Upload the image to Cloudinary
      const imageUrl = await uploadToCloudinary(imageUri);
      if (!imageUrl) {
        console.error("Cloudinary upload failed");
        return;
      }
  
      let formData = new FormData();
      formData.append("image_url", imageUrl);  // Ensure the key here matches what the server expects
      formData.append("choice", choice);
      if (sub_choice) formData.append("sub_choice", sub_choice);
  
      setLoading(true);
      
      // Use TextResponse class to get the result
      const result = await TextResponse.process(formData);
  
      if (React.isValidElement(result)) {
        addMessage("bot", null, <View>{result}{renderResultActions()}</View>);
      } else {
        addMessage("bot", null, <View>{renderBotMessage(result)}{renderResultActions()}</View>);
      }
    } catch (err) {
      console.error("Failed to get advice:", err);
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (sender, text, component = null) => {
    setMessages((prev) => [...prev, { sender, text, component }]);
  };

  const handleOptionSelect = (opt) => {
    setSelectedOption(opt);
    addMessage("user", opt);
    fetchSubOptions(opt);
  };

  const handleSubOptionSelect = (sub) => {
    setSelectedSub(sub);
    addMessage("user", sub);
    submitAdvice(selectedOption, sub);
  };

  const renderBotMessage = (text) => {
    if (Array.isArray(text)) {
      return text.map((line, i) => (
        <Text key={i} style={styles.messageText}>
          • {line}
        </Text>
      ));
    }

    return text.split("\n").map((line, i) => (
      <Text key={i} style={styles.messageText}>
        {line.includes("**")
          ? line.split("**").map((part, j) =>
              j % 2 === 1 ? (
                <Text key={j} style={styles.boldText}>
                  {part}
                </Text>
              ) : (
                <Text key={j}>{part}</Text>
              )
            )
          : line}
      </Text>
    ));
  };

  const renderResultActions = () => (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setSelectedSub(null)}
      >
        <Text style={styles.actionButtonText}>Choose Another Sub Option</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setSelectedOption(null);
          setSelectedSub(null);
        }}
      >
        <Text style={styles.actionButtonText}>Choose Another Main Option</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setSelectedOption(null);
          setSelectedSub(null);
          setMessages([]);
          navigation.navigate("AddMain");
        }}
      >
        <Text style={styles.actionButtonText}>Take Another Photo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} ref={scrollViewRef}>
      <Image source={{ uri: imageUri }} style={styles.image} />

      {messages.map((msg, idx) => (
        <View
          key={idx}
          style={msg.sender === "user" ? styles.userBubble : styles.botBubble}
        >
          {msg.component ||
            (msg.text && (
              <Text style={styles.messageText}>{msg.text}</Text>
            ))}
        </View>
      ))}

      {!selectedOption &&
        options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.option}
            onPress={() => handleOptionSelect(opt)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}

      {selectedOption && subOptions.length > 0 && !selectedSub &&
        subOptions.map((sub) => (
          <TouchableOpacity
            key={sub}
            style={styles.option}
            onPress={() => handleSubOptionSelect(sub)}
          >
            <Text style={styles.optionText}>{sub}</Text>
          </TouchableOpacity>
        ))}

      {loading && (
        <View style={styles.loadingContainer}>
          <Image
            source={require("C://Facultation//licenta//PhotographyAdviceApp//Client//utils//Animation - 1745528021109.gif")}
            style={styles.loadingAnimation}
          />
          <Text style={styles.thinkingText}>Thinking ...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#222",
    minHeight: "100%",
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  option: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  botBubble: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  boldText: {
    fontWeight: "bold",
    color: "#fff",
  },
  loadingAnimation: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  thinkingText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
