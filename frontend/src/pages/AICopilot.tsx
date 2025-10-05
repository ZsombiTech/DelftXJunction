/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import {
  chatWithCopilot,
  type ChatMessage,
  type DriverStats,
} from "../services/chatgpt";
import { useDriverStatsMutation } from "../redux/api/copilotApi";
import LoadingScreen from "../components/LoadingScreen";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AICopilot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [driverStatsRequest, { isLoading: isDriverStatsLoading }] =
    useDriverStatsMutation();

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.role === "assistant" && !isLoading) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find((v) => v.lang === "en-US") || null;
        utterance.pitch = 1;
        utterance.rate = 1; // 1 is normal speed
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn("Speech Synthesis not supported by this browser.");
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Fetch driver stats on component mount
    const fetchDriverStats = async () => {
      try {
        const response = await driverStatsRequest().unwrap();
        setDriverStats(response);

        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Welcome to your AI Copilot! I've loaded your driving data. You have ${response.total_trips} trips and earned $${response.total_earnings?.toFixed(2)}. How can I help you today?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error("Failed to fetch driver stats:", error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Welcome to your AI Copilot! I had trouble loading your data, but I can still help answer questions.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      }
    };

    fetchDriverStats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const conversationHistory: ChatMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await chatWithCopilot(
        inputMessage,
        conversationHistory,
        driverStats
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isDriverStatsLoading && !driverStats) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-uber-gray-50">
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-uber-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-uber-black rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-uber-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-uber-gray-900">
                AI Copilot
              </h1>
              <p className="text-sm text-uber-gray-600">
                Your personal driving assistant
              </p>
            </div>
          </div>
        </div>

        {driverStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-uber-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-uber-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-uber-black">
                {driverStats.total_trips}
              </p>
            </div>
            <div className="bg-uber-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-uber-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-uber-black">
                ${driverStats.total_earnings?.toFixed(2)}
              </p>
            </div>
            <div className="bg-uber-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-uber-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-uber-black">
                {driverStats.total_distance_km?.toFixed(0)} km
              </p>
            </div>
            <div className="bg-uber-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-uber-gray-600">Rating</p>
              <p className="text-2xl font-bold text-uber-black">
                {driverStats.average_rating?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>
        )}

        <div
          className="bg-uber-white rounded-lg shadow-md overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-uber-gray-200"
                      : "bg-uber-black"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-uber-gray-700" />
                  ) : (
                    <Bot className="w-5 h-5 text-uber-white" />
                  )}
                </div>

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-uber-black text-uber-white"
                      : "bg-uber-gray-100 text-uber-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-uber-gray-400"
                        : "text-uber-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-uber-black flex items-center justify-center">
                  <Bot className="w-5 h-5 text-uber-white" />
                </div>
                <div className="bg-uber-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-uber-gray-600 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-uber-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your driving..."
                className="flex-1 px-4 py-3 border border-uber-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent text-uber-gray-900 placeholder-uber-gray-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-uber-black text-uber-white rounded-full flex items-center justify-center hover:bg-uber-gray-800 disabled:bg-uber-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICopilot;
