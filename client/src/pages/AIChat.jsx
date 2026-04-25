import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, addMessage } from '../slices/aiSlice';
import { 
  Send, Sparkles, User, Bot, 
  Terminal, ShieldCheck, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const AIChat = () => {
  const [input, setInput] = useState('');
  const { messages, loading } = useSelector((state) => state.ai);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    dispatch(addMessage(userMessage));
    setInput('');
    dispatch(sendMessage(input));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">FinAI Assistant</h2>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Gemini 1.5 Flash Active
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
                <ShieldCheck size={14} className="text-emerald-500" /> SECURE CHANNEL
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">
                <Zap size={14} className="text-amber-500" /> REAL-TIME ANALYSIS
             </div>
        </div>
      </div>

      <div className="flex-1 glass-dark rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-slate-800/50 rounded-[2rem] flex items-center justify-center border border-slate-700">
                    <Sparkles className="text-emerald-500" size={32} />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-lg font-bold text-white mb-2">How can I help you, {user?.name}?</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        "What was my biggest expense last month?" or "How can I save $200 next month?"
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    {['Budget Review', 'Savings Strategy', 'Debt Analysis', 'Investment Tips'].map(tip => (
                        <button key={tip} onClick={() => setInput(tip)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all font-medium italic">
                            {tip}
                        </button>
                    ))}
                </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-3xl px-6 py-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                <div className="prose prose-invert prose-emerald max-w-none">
                  <ReactMarkdown>
                    {msg.text || ''}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <Bot size={20} />
                </div>
                <div className="bg-slate-800/80 rounded-3xl rounded-tl-none px-6 py-4 flex gap-1 items-center border border-slate-700">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
             </div>
          )}
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-slate-700/50">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <div className="relative flex-1">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your financial assistant anything..."
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 text-slate-200"
                />
            </div>
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="p-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-600 mt-4 uppercase tracking-[0.2em] font-bold">
             Financial advice generated by AI should be verified with a certified human professional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
