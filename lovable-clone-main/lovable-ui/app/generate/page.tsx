"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type AgentMessage =
  | { type: "status"; message: string }
  | { type: "assistant_message"; content: string }
  | { type: "plan"; title: string; steps: string[]; stack: string[] }
  | {
      type: "deployment";
      environment: "preview" | "production";
      url: string;
      notes?: string;
    }
  | { type: "complete"; summary: string; previewUrl?: string }
  | { type: "error"; message: string };

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prompt = searchParams.get("prompt") || "";
  
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (!prompt) {
      router.push("/");
      return;
    }
    
    // Prevent double execution in StrictMode
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    
    setIsGenerating(true);
    generateWebsite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, router]);
  
  const generateWebsite = async () => {
    try {
      setMessages([]);
      setError(null);
      setPreviewUrl(null);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate website");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsGenerating(false);
              break;
            }

            try {
              const event = JSON.parse(data) as AgentMessage;

              if (event.type === "deployment") {
                if (event.url) {
                  setPreviewUrl(event.url);
                }
              }

              if (event.type === "complete") {
                setPreviewUrl(event.previewUrl || null);
                setIsGenerating(false);
              }

              setMessages((prev) => [...prev, event]);

              if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      setIsGenerating(false);
    } catch (err: any) {
      console.error("Error generating website:", err);
      setError(err.message || "An error occurred");
      setIsGenerating(false);
    }
  };
  
  return (
    <main className="h-screen bg-black flex flex-col overflow-hidden relative">
      <Navbar />
      {/* Spacer for navbar */}
      <div className="h-16" />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Chat */}
        <div className="w-[30%] flex flex-col border-r border-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Lovable</h2>
            <p className="text-gray-400 text-sm mt-1 break-words">{prompt}</p>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
            {messages.map((message, index) => {
              if (message.type === "status") {
                return (
                  <div key={index} className="text-gray-500 text-sm font-mono">
                    {message.message}
                  </div>
                );
              }

              if (message.type === "assistant_message") {
                return (
                  <div key={index} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">AI</span>
                      </div>
                      <span className="text-white font-medium">OpenAI Codex Agent</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                );
              }

              if (message.type === "plan") {
                return (
                  <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <h3 className="text-white font-semibold mb-2">{message.title}</h3>
                    <div className="text-gray-300 text-sm space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-200">Execution Steps</h4>
                        <ol className="list-decimal ml-5 space-y-1">
                          {message.steps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200">Technology Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {message.stack.map((item) => (
                            <span
                              key={item}
                              className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (message.type === "deployment") {
                return (
                  <div key={index} className="bg-emerald-900/10 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-300">
                    <div className="font-semibold">Deployment prep: {message.environment}</div>
                    {message.notes && <p className="mt-1 text-emerald-200/80">{message.notes}</p>}
                    {message.url && (
                      <a
                        href={message.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-emerald-400 hover:text-emerald-300"
                      >
                        View deployment →
                      </a>
                    )}
                  </div>
                );
              }

              if (message.type === "complete") {
                return (
                  <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="text-green-400 font-semibold mb-2">Plan Ready</div>
                    <p className="text-gray-300 text-sm">{message.summary}</p>
                  </div>
                );
              }

              if (message.type === "error") {
                return (
                  <div key={index} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400">{message.message}</p>
                  </div>
                );
              }

              return null;
            })}
            
            {isGenerating && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>Working...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Bottom input area */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Lovable..."
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-800 focus:outline-none focus:border-gray-700"
                disabled={isGenerating}
              />
              <button className="p-2 text-gray-400 hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Preview */}
        <div className="w-[70%] bg-gray-950 flex items-center justify-center">
          {!previewUrl && isGenerating && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
              <p className="text-gray-400">Spinning up preview...</p>
            </div>
          )}
          
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="Website Preview"
            />
          )}
          
          {!previewUrl && !isGenerating && (
            <div className="text-center">
              <p className="text-gray-400">Preview will appear here</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}