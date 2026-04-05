import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '../hooks/useAuth';

export default function AIChatAgent({ portfolioId, onDesignApplied }: { portfolioId: string, onDesignApplied: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Hi! I am your AI Design Agent. How would you like to customize your portfolio today? (e.g. "make the background dark", "add rounded corners", "import styles matching 21st.dev")' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat-design', {
        portfolioId,
        prompt: newMsg.content,
        history: messages.slice(1) // skip the initial greeting
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.designApplied && onDesignApplied) {
        onDesignApplied();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, something went wrong. Make sure my API key is configured!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 380,
              height: 500,
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fafafa' }}>Design Agent ✨</h3>
                <p style={{ fontSize: 12, color: '#a1a1aa', margin: 0, fontFamily: 'monospace' }}>Powered by GPT-4o</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 20 }}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    background: m.role === 'user' ? '#fafafa' : 'rgba(255,255,255,0.06)',
                    color: m.role === 'user' ? '#000' : '#fafafa',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 12, display: 'flex', gap: 4 }}>
                    <div className="dot-pulse"></div>
                  </div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask for design changes..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    padding: '10px 16px',
                    color: '#fafafa',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="glass-btn small"
                  style={{ borderRadius: 20, padding: '0 16px', height: 40, border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  ↑
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: '#fafafa',
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isOpen ? '✕' : '✨'}
      </button>

      <style>{`
        .dot-pulse {
          width: 6px;
          height: 6px;
          background: #a1a1aa;
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
