import { useState, useRef, useEffect } from "react";

/* ======================
   BACKEND BASE URL
====================== */
const API_BASE_URL = "https://chat-box-ai-backend.vercel.app/api"; // direct stable backend URL

export default function App() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "agent", text: "Hello! Please ask a question." },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  /* ======================
     TEXT TO SPEECH
  ====================== */
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  /* ======================
     VOICE INPUT
  ====================== */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      addMessage("user", text);
      askBackend(text);
    };
    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      addMessage("agent", "Sorry, I couldn't hear you clearly.");
    };
    recognition.start();
  };

  /* ======================
     BACKEND API CALL
  ====================== */
  const askBackend = async (question) => {
    if (!question.trim()) return;
    setIsLoading(true);
    addMessage("user", question);

    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      addMessage("agent", data.answer || "No response received.");
      speak(data.answer);
    } catch (err) {
      console.error("Backend error:", err);
      addMessage("agent", "Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ======================
     ADD MESSAGE
  ====================== */
  const addMessage = (type, text) => {
    setMessages((prev) => [...prev, { type, text }]);
  };

  /* ======================
     TEXT SUBMIT
  ====================== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const question = inputText.trim();
    setInputText("");
    askBackend(question);
  };

  /* ======================
     CLOSE CHAT
  ====================== */
  const closeChat = () => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    fetch(`${API_BASE_URL}/clear`, { method: "POST" }).catch(() => {});
    setMessages([{ type: "agent", text: "Hello! Please ask a question." }]);
    setOpen(false);
  };

  /* ======================
     CLEAR CHAT ON TAB CLOSE
  ====================== */
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(`${API_BASE_URL}/clear`);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  /* ======================
     AUTO SCROLL
  ====================== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-xl hover:bg-indigo-700 transition"
        >
          💬
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-[92vw] sm:w-96 h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">AI Assistant</h2>
            <button
              onClick={closeChat}
              className="text-xl text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${
                    msg.type === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white shadow text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl text-sm bg-white shadow text-gray-600">
                  AI is thinking...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-4 border-t bg-white"
          >
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-indigo-600 text-white px-5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              Send
            </button>
          </form>

          <div className="px-4 pb-4 pt-0">
            <button
              onClick={startListening}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              🎤 Talk
            </button>
          </div>
        </div>
      )}
    </>
  );
}
