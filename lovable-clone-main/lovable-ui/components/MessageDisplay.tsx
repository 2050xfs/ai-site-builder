import { useMemo } from "react";
import type { SiteBuilderEvent } from "@/lib/openai-agent";

interface MessageDisplayProps {
  events: SiteBuilderEvent[];
}

export default function MessageDisplay({ events }: MessageDisplayProps) {
  const generatedPages = useMemo(() => {
    return events
      .filter((event) => event.type === "deployment" && event.url)
      .map((event) => event.type === "deployment" ? event.url : "")
      .filter(Boolean);
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 max-w-4xl mx-auto px-4">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          {generatedPages.length > 0 && (
            <div className="flex gap-2">
              {generatedPages.map((page) => (
                <a
                  key={page}
                  href={page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  Open preview →
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {events.map((event, index) => {
            if (event.type === "status") {
              return (
                <div key={index} className="text-gray-500 text-sm font-mono">
                  {event.message}
                </div>
              );
            }

            if (event.type === "assistant_message") {
              return (
                <div key={index} className="text-gray-300 leading-relaxed">
                  {event.content}
                </div>
              );
            }

            if (event.type === "plan") {
              return (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-white font-semibold mb-2">{event.title}</h3>
                  <ol className="list-decimal ml-5 text-gray-300 space-y-1 text-sm">
                    {event.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                </div>
              );
            }

            if (event.type === "deployment") {
              return (
                <div key={index} className="text-sm text-emerald-300">
                  Deployment target: {event.environment}
                </div>
              );
            }

            if (event.type === "complete") {
              return (
                <div key={index} className="text-green-400 text-sm">
                  {event.summary}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
