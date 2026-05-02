'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your health assistant. Ask me about any health concerns and I'll recommend the right products for you." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.slice(1);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: text, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        {/* Label */}
        {!open && (
          <span
            className="text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md animate-bounce"
            style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', whiteSpace: 'nowrap' }}
          >
            Health Assistant
          </span>
        )}
        {/* Pulse ring */}
        <div className="relative">
          {!open && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(139,195,74,0.4)' }}
            />
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-16 h-16 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)',
              boxShadow: '0 8px 32px rgba(139,195,74,0.6)',
            }}
            aria-label="Open chat assistant"
          >
            {open ? <X size={26} /> : <MessageCircle size={26} />}
          </button>
        </div>
      </div>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-28 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl overflow-hidden flex flex-col"
          style={{
            height: '480px',
            background: '#ffffff',
            border: '1px solid rgba(139,195,74,0.2)',
            boxShadow: '0 24px 64px rgba(139,195,74,0.2)',
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)' }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Health Assistant</p>
              <p className="text-white/70 text-xs">Powered by AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#f8fdf2' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)', color: 'white', borderBottomRightRadius: '6px' }
                    : { background: '#ffffff', color: '#1a3a06', borderBottomLeftRadius: '6px', border: '1px solid rgba(139,195,74,0.15)' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl flex items-center gap-2"
                  style={{ background: '#ffffff', border: '1px solid rgba(139,195,74,0.15)', borderBottomLeftRadius: '6px' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: '#8bc34a' }} />
                  <span className="text-xs" style={{ color: '#6a9e2f' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t bg-white" style={{ borderColor: 'rgba(139,195,74,0.15)' }}>
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about health products..."
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
                style={{
                  border: '1.5px solid rgba(139,195,74,0.25)',
                  maxHeight: '80px',
                  color: '#1a3a06',
                  background: '#f8fdf2',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#8bc34a'; e.target.style.boxShadow = '0 0 0 3px rgba(139,195,74,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(139,195,74,0.25)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)' }}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
