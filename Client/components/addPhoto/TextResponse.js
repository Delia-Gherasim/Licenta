import React from 'react';
import { Text } from 'react-native';

export default class TextResponse {
  static async process(formData) {
    const API_URL = "http://localhost:8000/chatbot/advice";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData, 
      });

      const data = await res.json();

      if (data?.advice_type === "aesthetic_score") {
        const result = data.result || "No result.";
        if (result.includes("I give it")) {
          const scoreMatch = result.match(/I give it ([\d.]+) out of 10/);
          const score = scoreMatch ? scoreMatch[1] : null;
          const feedback = result.split("I give it")[0].trim();
          return (
            <>
              <Text style={{ color: "#fff", marginBottom: 6 }}>{feedback}</Text>
              {score && (
                <Text style={{ fontWeight: "bold", color: "#fff" }}>
                  Aesthetic Score: <Text style={{ color: "#fff" }}>{score}</Text> / 10
                </Text>
              )}
            </>
          );

        }
        const lines = result.split("\n").filter(Boolean);
        return lines.map((line, i) => (
          <Text key={i} style={{ color: "#fff", marginBottom: 6 }}>
            {line.includes("**")
              ? line.split("**").map((part, j) =>
                  j % 2 === 1 ? (
                    <Text key={j} style={{ fontWeight: "bold", color: "#fff" }}>
                      {part}
                    </Text>
                  ) : (
                    <Text key={j}>{part}</Text>
                  )
                )
              : line}
          </Text>
        ));
      } else  {
        // Handle the technical quality advice
        const result = data.result || "No result.";
        const lines = result.split("\n").filter(Boolean);
        return lines.map((line, i) => (
          <Text key={i} style={{ color: "#fff", marginBottom: 6 }}>
            {line}
          </Text>
        ));
      }

      return "No aesthetic score found in response.";
    } catch (error) {
      console.error("Error in AestheticStrategy:", error);
      return "An error occurred while processing the request.";
    }
  }
}
