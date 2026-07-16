import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Recipe } from "../types";
import { ChefError, askChef } from "../lib/ai";

interface Props {
  recipe: Recipe;
  onError: (message: string) => void;
  onAsked: () => void;
}

const SUGGESTIONS = [
  "What can I substitute?",
  "Make it less spicy",
  "Can I prep this ahead?",
];

export default function ChefChat({ recipe, onError, onAsked }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New recipe → fresh conversation
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [recipe.title]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    const history = messages;
    setMessages((m) => [...m, { role: "user", text: question }]);
    try {
      const answer = await askChef(recipe, history, question);
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      onAsked();
    } catch (e) {
      setMessages(history); // roll back the unanswered question
      setInput(question);
      onError(e instanceof ChefError ? e.message : "The chef didn't catch that. Try again!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chef-chat">
      <h3 className="section-title">💬 Ask the chef about this dish</h3>
      {messages.length === 0 && (
        <div className="chip-row" style={{ marginTop: 0 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      )}
      {(messages.length > 0 || busy) && (
        <div className="chat-scroll" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
          ))}
          {busy && <div className="chat-bubble assistant typing">🍳 thinking…</div>}
        </div>
      )}
      <div className="chat-input-row">
        <input
          className="query-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="No black vinegar — what can I use instead?"
          disabled={busy}
        />
        <button className="cook-btn" onClick={() => send()} disabled={busy || !input.trim()}>
          Ask 💬
        </button>
      </div>
    </div>
  );
}
