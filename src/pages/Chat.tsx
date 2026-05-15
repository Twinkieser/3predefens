/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, Sparkles, User as UserIcon, Bot } from 'lucide-react';
import { User } from 'firebase/auth';
import { getEcoChatResponse } from '../services/ai';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage({ user }: { user: User | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your EcoSort AI assistant. How can I help you with recycling in Kazakhstan today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await getEcoChatResponse(input, messages.map(m => ({ role: m.role, content: m.content })));
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
       setMessages(prev => [...prev, {
         id: (Date.now() + 1).toString(),
         role: 'assistant',
         content: "I'm sorry, I encountered an error. Please try again."
       }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-100 flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold">Eco Assistant</h1>
          <div className="flex items-center space-x-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Online & Thinking</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start space-x-3",
              msg.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-primary text-white" : "bg-white border border-slate-100 text-primary"
            )}>
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-primary text-white rounded-tr-none" 
                : "bg-white border border-slate-100 rounded-tl-none text-slate-700 shadow-sm"
            )}>
              <div className="markdown-body prose prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex items-start space-x-3"
          >
             <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary">
               <Bot size={16} />
             </div>
             <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 size={16} className="animate-spin text-primary" />
             </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form 
          onSubmit={handleSend}
          className="bg-slate-50 border border-slate-100 rounded-2xl flex items-center p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about recycling..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-md",
              input.trim() ? "bg-primary text-white" : "bg-slate-200 text-slate-400"
            )}
          >
            <Send size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}
