import { useState, useCallback, useRef } from 'react';

export function useSSE() {
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const startStream = useCallback(async (url, body) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsStreaming(true);
    setEvents([]);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'done') {
                setIsStreaming(false);
                return;
              }
              setEvents(prev => [...prev, event]);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('SSE error:', err);
    }
    setIsStreaming(false);
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, isStreaming, startStream, stopStream, clearEvents };
}
