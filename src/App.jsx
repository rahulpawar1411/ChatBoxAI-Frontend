import { useState, useRef, useEffect } from "react";

/* ======================
   BACKEND BASE URL
====================== */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://chat-box-ai-backend-r79resybt-rahul-pawars-projects-46d6b9a1.vercel.app";

export default function App() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "agent", text: "Hello! Please ask a question." },
  ]);
  const [inputText, setInputText] = useState("");

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
    if (!SR) return alert("Speech Recognition not supported");

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      addMessage("user", text);
      askBackend(text);
    };

    recognition.start();
  };

  /* ======================
     BACKEND API CALL
  ====================== */
  const askBackend = async (question) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      addMessage("agent", data.answer);
      speak(data.answer);
    } catch (err) {
      console.error(err);
      addMessage("agent", "Sorry, something went wrong.");
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
    if (!inputText.trim()) return;

    addMessage("user", inputText);
    askBackend(inputText);
    setInputText("");
  };

  /* ======================
     CLOSE CHAT
  ====================== */
  const closeChat = () => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();

    fetch(`${API_BASE_URL}/clear`, { method: "POST" });

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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-xl"
        >
          💬
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-[92vw] sm:w-96 h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-bold text-gray-800">AI Assistant</h2>
            <button onClick={closeChat} className="text-xl">✕</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  msg.type === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-xl px-3 py-2"
            />
            <button className="bg-indigo-600 text-white px-4 rounded-xl">
              Send
            </button>
          </form>

          <div className="p-3 pt-0">
            <button
              onClick={startListening}
              className="w-full bg-indigo-600 text-white py-2 rounded-xl"
            >
              🎤 Talk
            </button>
          </div>
        </div>
      )}
    </>
  );
}
