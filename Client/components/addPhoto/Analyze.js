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
import { Dimensions } from "react-native";
import TextResponse from "./TextResponse";
import Constants from 'expo-constants';

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

  const API_URL = Constants.expoConfig.extra.API_URL_CHATBOT;
  const optionLabels = {
    aesthetic_score: "Aesthetic Score",
    technical_quality: "Technical Quality",
    object_advice: "Object Advice",
    scene_advice: "Scene Advice",
    general_advice: "General Advice",
    genre_advice: "Genre Advice",
  };
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
      const imageUrl = await uploadToCloudinary(imageUri);
      if (!imageUrl) {
        console.error("Cloudinary upload failed");
        return;
      }
  
      let formData = new FormData();
      formData.append("image_url", imageUrl);  
      formData.append("choice", choice);
      if (sub_choice) formData.append("sub_choice", sub_choice);
  
      setLoading(true);
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
            <Text style={styles.optionText}>{optionLabels[opt] || opt}</Text>
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
            source={require("../../assets/Animation - 1745528021109.gif")} 
            style={styles.loadingAnimation}
          />
          <Text style={styles.thinkingText}>Thinking ...</Text>
        </View>
      )}
      <View style={{ height: 80}} />
    </ScrollView>
  );
}
const screenHeight = Dimensions.get("window").height;
const styles = StyleSheet.create({
  container: {
    height: screenHeight,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#F4F4F9",
    minHeight: "100%",
    paddingBottom: 40,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#D1D1E9",
  },
  option: {
    backgroundColor: "#6A4C93",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  userBubble: {
    backgroundColor: "#6A4C93",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  botBubble: {
    backgroundColor: "#1985A1",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    flexWrap: "wrap",
  },
  boldText: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loadingAnimation: {

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
    color: "#555",
    fontSize: 18,
    marginLeft: 10,
    fontStyle: "italic",
  },
  actionButton: {
    backgroundColor: "#6A4C93",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
