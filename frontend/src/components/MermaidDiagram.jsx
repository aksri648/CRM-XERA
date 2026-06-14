import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#0ea5e9',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#334155',
    lineColor: '#475569',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#334155',
    clusterBkg: '#0f172a',
    clusterBorder: '#1e293b',
    titleColor: '#e2e8f0',
    edgeLabelBackground: '#1e293b',
    fontFamily: 'Inter, sans-serif',
  },
  flowchart: { curve: 'basis', padding: 20 },
});

export default function MermaidDiagram({ chart, className = '' }) {
  const ref = useRef(null);
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!ref.current || !chart) return;
    let cancelled = false;
    async function render() {
      try {
        const { svg } = await mermaid.render(id.current, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre style="color:#ef4444;font-size:12px;">${e.message}</pre>`;
        }
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div className={`my-6 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0f172a] p-6 ${className}`}>
      <div ref={ref} className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" />
    </div>
  );
}
