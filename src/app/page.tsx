"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState("");

  const sendMessage = async () => {
    // Clear the input message
    setMessage("");

    // Add the user's message and a placeholder for the assistant's response
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      // Send the user's message to the server
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      // Check if response.body is not null
      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Read the response stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      // Process the response text
      const processText = async ({
        done,
        value,
      }: {
        done: boolean;
        value?: Uint8Array;
      }) => {
        let result = "";
        const decoder = new TextDecoder();

        if (done) {
          return result;
        }

        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });

        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });

        const { done: doneReading, value: nextValue } = await reader.read();
        return processText({ done: doneReading, value: nextValue });
      };

      // Start reading the response
      const { done, value } = await reader.read();
      await processText({ done, value });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col w-[500px] h-[700px] border border-black p-4 space-y-3">
        <div className="flex flex-col space-y-2 flex-grow overflow-auto max-h-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`${
                  message.role === "assistant"
                    ? "bg-primary-main"
                    : "bg-secondary-main"
                } text-white rounded-lg p-3`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Message"
            className="flex-grow border border-gray-300 rounded p-2 text-black"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white rounded p-2"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
