import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bot, X, Send } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import AgentResponseRenderer from './AgentResponseRenderer';
import api from '../lib/api';

export default function AICommandCentre({ onClose }) {
  const { getToken } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const { events, isStreaming, startStream, clearEvents } = useSSE();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try { const r = await api.get('/api/pipeline/status'); setSysStatus(r.data); } catch (e) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const token = await getToken();
    const msg = input;
    setInput('');
    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/chat`,
      { session_id: sessionId, message: msg },
      token
    );
  };

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.type === 'text') {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, content: lastEvent.content };
            return updated;
          }
          return [...prev, { role: 'assistant', content: lastEvent.content, structuredEvents: [] }];
        });
      } else {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, structuredEvents: [...(last.structuredEvents || []), lastEvent] };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '', structuredEvents: [lastEvent] }];
        });
      }
    }
  }, [events]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0fd4b4] flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">AI Command Centre</p>
              <p className="text-xs text-gray-500">System overview & assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">WORKER</p>
            <p className={`text-sm font-bold ${sysStatus?.channel_service_health === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {sysStatus?.channel_service_health === 'ok' ? 'Healthy' : 'Degraded'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">QUEUE</p>
            <p className="text-sm font-bold text-gray-900">{sysStatus?.queue_pending || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">ACTIVE RUNS</p>
            <p className="text-sm font-bold text-gray-900">{sysStatus?.active_campaigns || 0}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
              <p className="text-sm text-gray-700">
                Hello, I am the Xeno AI Command Centre. I can help you monitor system activity, generate campaigns, discover opportunities, or answer questions about your CRM. How can I assist you?
              </p>
              <p className="text-xs text-gray-400 text-right mt-1">{new Date().toLocaleTimeString()}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none px-4 py-3' : 'bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3'}`}>
                <p className="text-sm">{msg.content}</p>
                {msg.structuredEvents && msg.structuredEvents.length > 0 && (
                  <div className="mt-2"><AgentResponseRenderer events={msg.structuredEvents} /></div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about system status, campaigns, or customers..." disabled={isStreaming} className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0fd4b4] disabled:opacity-50" />
            <button onClick={handleSend} disabled={isStreaming} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white rounded-lg px-4 py-3 transition-colors disabled:opacity-50">
              {isStreaming ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
