import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { API } from '../hooks/useAuth';

type ChatMessage = { role: string; content: string };

export default function AIChatAgent({
  portfolioId,
  onDesignApplied,
}: {
  portfolioId: string;
  onDesignApplied: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I am your Portify copilot. Ask me anything about your portfolio, writing, skills, design, or job prep. I can answer questions and apply portfolio changes when you ask for them.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [isOpen, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat-design', {
        portfolioId,
        prompt: newMsg.content,
        history: messages.slice(1),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      const changesApplied = Boolean(res.data.changesApplied ?? res.data.designApplied);
      if (changesApplied) {
        onDesignApplied();
      }
    } catch (err: any) {
      const backendMsg = err?.response?.data?.reply || err?.response?.data?.error;
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: backendMsg || 'Oops, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="copilot-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onMouseDown={() => inputRef.current?.focus()}
            style={{
              width: 'min(420px, calc(100vw - 32px))',
              height: 'min(560px, calc(100vh - 112px))',
              maxHeight: 'calc(100vh - 112px)',
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              boxShadow: '0 18px 60px rgba(15,23,42,0.24)',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              pointerEvents: 'auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>Portfolio Copilot</h3>
                <p style={{ fontSize: 13, color: 'var(--muted-strong)', margin: 0, fontFamily: 'monospace' }}>
                  Powered by GPT-4o
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 22,
                  pointerEvents: 'auto',
                }}
              >
                X
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding: 24,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                >
                  <div
                    style={{
                      background: message.role === 'user' ? 'var(--fg)' : 'var(--card)',
                      color: message.role === 'user' ? 'var(--bg-elevated)' : 'var(--fg)',
                      padding: '14px 18px',
                      borderRadius: 14,
                      fontSize: 15,
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      border: message.role === 'assistant' ? '1px solid var(--border)' : 'none',
                      borderBottomRightRadius: message.role === 'user' ? 2 : 12,
                      borderBottomLeftRadius: message.role === 'assistant' ? 2 : 12,
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div
                    style={{
                      background: 'var(--card)',
                      padding: '14px 18px',
                      borderRadius: 14,
                      display: 'flex',
                      gap: 6,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="dot-pulse"></div>
                  </div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            <div style={{ padding: 18, borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && sendMessage()}
                  autoComplete="off"
                  placeholder="Ask anything about your portfolio..."
                  className="chat-input"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 22,
                    padding: '14px 18px',
                    color: 'var(--fg)',
                    fontSize: 16,
                    outline: 'none',
                    caretColor: 'var(--fg)',
                    pointerEvents: 'auto',
                  }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="glass-btn small"
                  aria-label="Send message"
                  style={{
                    borderRadius: 22,
                    padding: '0 18px',
                    height: 48,
                    minWidth: 76,
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                    pointerEvents: 'auto',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className="copilot-fab"
        type="button"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close portfolio copilot' : 'Open portfolio copilot'}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: 'var(--fg)',
          color: 'var(--bg-elevated)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 24px rgba(15,23,42,0.24)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
          pointerEvents: 'auto',
        }}
      >
        {isOpen ? 'X' : 'AI'}
      </button>

      <style>{`
        .chat-input::placeholder {
          color: var(--muted);
        }
        .chat-input:focus {
          border-color: var(--muted-strong) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
        }
        .dot-pulse {
          width: 6px;
          height: 6px;
          background: var(--muted-strong);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
