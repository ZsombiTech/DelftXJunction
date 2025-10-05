/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DriverStats {
  total_trips: number;
  total_earnings: number;
  total_distance_km: number;
  total_duration_mins: number;
  average_rating: number | null;
  experience_months: number | null;
  trips: any[];
}

export const chatWithCopilot = async (
  userMessage: string,
  conversationHistory: ChatMessage[],
  driverStats: DriverStats | null
): Promise<string> => {
  try {
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are an AI assistant for Uber drivers. You have access to the driver's statistics and trip history.

Driver Stats:
- Total Trips: ${driverStats?.total_trips || 0}
- Total Earnings: $${driverStats?.total_earnings?.toFixed(2) || "0.00"}
- Total Distance: ${driverStats?.total_distance_km?.toFixed(2) || 0} km
- Total Duration: ${driverStats?.total_duration_mins?.toFixed(2) || 0} minutes
- Average Rating: ${driverStats?.average_rating?.toFixed(2) || "N/A"}
- Experience: ${driverStats?.experience_months || 0} months

You should help the driver with:
- Analyzing their performance and earnings
- Providing insights about their trips
- Answering questions about their driving history
- Giving tips to improve earnings and ratings
- Explaining patterns in their trip data

Be helpful, concise, and professional. Use the Uber brand voice - friendly but professional.`,
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPEN_AI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling ChatGPT:", error);
    throw new Error("Failed to get response from AI Copilot");
  }
};
