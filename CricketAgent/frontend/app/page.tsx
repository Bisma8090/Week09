"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "bot"; content: string };

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const suggestions = [
  
  { icon: "🏆", text: "Most wins at MCG" },
  { icon: "💥", text: "Wins by 100+ runs at Sharjah" },
  { icon: "🏏", text: "Top 5 ODI run scorers" },
];



export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hey! Ask me anything about cricket stats — Test, ODI, or T20 🏏\n\nI can show you player rankings, team stats, match records and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.answer || "No answer found." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error connecting to server. Make sure backend is running." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div className="app-bg">
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="relative z-10 flex flex-col h-screen max-w-3xl mx-auto">

        {/* ── Header ── */}
        <header className="header-bar px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="logo-box w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg animate-cricket select-none">🏏</span>
            </div>
            <div>
              <h1 className="brand-font text-xl font-bold gradient-text leading-none tracking-tight">
                Cricket AI
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide">
                Groq · LangGraph · RAG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="live-badge flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <span className="live-dot w-2 h-2 rounded-full bg-emerald-500 block" />
              <span className="text-xs text-emerald-700 font-semibold">Live</span>
            </div>
          </div>
        </header>

        <div className="pitch-line flex-shrink-0" />

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto messages-scroll px-3 sm:px-6 py-5 space-y-4">



          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 sm:gap-3 animate-fade-in-up ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
            >
              {msg.role === "bot" && (
                <div className="logo-box w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 shadow-md">
                  <span className="text-xs select-none">🏏</span>
                </div>
              )}

              <div
                className={`msg-bubble max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "msg-user rounded-br-sm animate-slide-right"
                    : "msg-bot rounded-bl-sm animate-slide-left"
                }`}
              >
                {msg.role === "bot" ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold select-none">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 sm:gap-3 animate-fade-in">
              <div className="logo-box w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-xs select-none">🏏</span>
              </div>
              <div className="msg-bot rounded-2xl rounded-bl-sm px-5 py-4">
                <div className="flex gap-1.5 items-center">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ── */}
        {showSuggestions && (
          <div className="px-3 sm:px-6 pb-3 animate-fade-in-up flex-shrink-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2.5 px-1">
              ✦ Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="chip text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                >
                  <span className="text-sm">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 pb-safe flex-shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="input-area flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2.5"
          >
            <span className="text-base select-none flex-shrink-0">🔍</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cricket stats, records, players..."
              className="input-field flex-1 text-sm py-1 px-1"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="send-btn rounded-xl px-4 sm:px-5 py-2 text-sm font-semibold flex items-center gap-1.5"
              aria-label="Send"
            >
              <span className="hidden sm:inline">Send</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2 tracking-wide">
            Cricket AI may make mistakes · Always verify important stats
          </p>
        </div>

      </div>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto cricket-table">
            <table>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        th: ({ children }) => <th>{children}</th>,
        td: ({ children }) => <td>{children}</td>,
        tr: ({ children }) => <tr>{children}</tr>,
        p: ({ children }) => <p className="leading-relaxed mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-emerald-700">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-none space-y-1 mt-2 text-slate-600">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5 flex-shrink-0">▸</span>
            <span>{children}</span>
          </li>
        ),
        h1: ({ children }) => (
          <h1 className="brand-font text-base font-bold text-slate-800 mb-2 mt-1 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="brand-font text-sm font-bold text-emerald-700 mb-1.5 mt-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-slate-700 mb-1 mt-2">{children}</h3>
        ),
        code: ({ children }) => (
          <code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md text-xs font-mono border border-emerald-100">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-emerald-400 pl-3 my-2 text-slate-500 italic bg-emerald-50/50 py-1 rounded-r-md">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
