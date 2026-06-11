import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { useSSE } from '../hooks/useSSE';
import AgentResponseRenderer from '../components/AgentResponseRenderer';

const suggestionPills = [
  'Active Buyers', 'At risk of losing buyers', 'VIP', 'New Buyers', 'Value Buyers',
];

export default function AIStudio() {
  const { getToken } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const { events, isStreaming, startStream, clearEvents } = useSSE();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInput('');
    if (!hasStarted) setHasStarted(true);

    const token = await getToken();
    await startStream(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/agent/chat`,
      { session_id: sessionId, message },
      token
    );
  };

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.type === 'text') {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = { ...lastMsg, content: lastEvent.content };
            return updated;
          }
          return [...prev, { role: 'assistant', content: lastEvent.content, structuredEvents: [] }];
        });
      } else {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              structuredEvents: [...(lastMsg.structuredEvents || []), lastEvent],
            };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '', structuredEvents: [lastEvent] }];
        });
      }
    }
  }, [events]);

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Sparkles size={64} className="text-[#0fd4b4] animate-pulse" />
        <h2 className="text-xl font-bold text-gray-900">What marketing goal would you like to achieve?</h2>
        <p className="text-gray-500 text-sm max-w-lg text-center">
          Describe your objective and Xeno AI will generate a complete campaign strategy including audience, channels, messaging, and A/B tests.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {suggestionPills.map(pill => (
            <button
              key={pill}
              onClick={() => handleSend(`Create a marketing campaign targeting the "${pill}" customer segment.`)}
              className="border border-[#0fd4b4] text-[#0fd4b4] rounded-full px-4 py-2 text-sm hover:bg-[#0fd4b4] hover:text-white transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="w-full max-w-2xl mt-8">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your marketing goal..."
              className="flex-1"
            />
            <Button onClick={() => handleSend()} className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Campaign Studio</h1>
        <p className="text-sm text-gray-500">Describe your marketing goal and let AI build the campaign</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-[#0fd4b4]'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-white" />}
              </div>
              <div>
                <div className={`px-4 py-3 ${msg.role === 'user' ? 'bg-[#0fd4b4] text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.structuredEvents && msg.structuredEvents.length > 0 && (
                  <div className="mt-2">
                    <AgentResponseRenderer events={msg.structuredEvents} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-[#0fd4b4] flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder="Describe your marketing goal..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isStreaming}
            className="bg-[#0fd4b4] hover:bg-[#0bbfa1] text-white"
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
