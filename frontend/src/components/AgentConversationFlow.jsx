import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Bot, User, Shield, Play, Pause, RotateCcw, Zap, Check, ChevronRight, Activity } from 'lucide-react';

const STEP_DURATION_BASE = 1800;

const steps = [
  { id: 1, type: 'user-message', text: 'Find all customers in Mumbai who haven\'t ordered in 60 days and send them a win-back offer.' },
  { id: 2, type: 'ai-thinking', text: 'Analyzing customer data...' },
  { id: 3, type: 'workflow', text: 'Backend → Segment Service', sub: 'Filtering customers:\nCity = Mumbai\nLast Order > 60 Days' },
  { id: 4, type: 'ai-result', count: 847, text: 'customers matching your criteria.', sub: 'Segment created. Drafting win-back messages...' },
  { id: 5, type: 'approval', text: 'Awaiting Approval' },
  { id: 6, type: 'user-message', text: 'Approved. Launch it.' },
  { id: 7, type: 'architecture', nodes: ['Frontend', 'User Auth', 'Backend', 'Agent Service', 'Campaign Builder', 'Channel Service', 'Backend'] },
  { id: 8, type: 'launch', text: 'Campaign "Win-Back Mumbai" launched.', sub: '847 messages queued across 2 channels. Tracking live.' },
  { id: 9, type: 'timeline', stages: ['Queued', 'Sent', 'Delivered', 'Opened', 'Clicked'] },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function NeonLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
          style={{ top: `${30 + i * 20}%`, width: '100%' }}
          animate={{ x: ['-100%', '100%'], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 ring-1 ring-cyan-500/20">
      <User className="h-3.5 w-3.5 text-cyan-400" />
    </div>
  );
}

function AIAvatar() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5 ring-1 ring-violet-500/20">
      <Bot className="h-3.5 w-3.5 text-violet-400" />
    </div>
  );
}

function MessageCard({ text, isAI, children }) {
  return (
    <div className="flex items-start gap-3">
      {isAI ? <AIAvatar /> : <UserAvatar />}
      <div
        className={`relative max-w-[85%] overflow-hidden rounded-2xl px-4 py-3 text-sm ${
          isAI
            ? 'rounded-tl-sm border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.03] text-gray-300'
            : 'rounded-tl-sm bg-white/[0.06] text-gray-300'
        }`}
      >
        {isAI && <NeonLines />}
        <div className="relative z-10">{children || <p>{text}</p>}</div>
      </div>
    </div>
  );
}

function WorkflowCard({ text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.03] px-4 py-3 text-sm text-gray-300">
        <NeonLines />
        <div className="relative z-10">
          <p className="mb-1 text-xs font-semibold text-cyan-400">{text}</p>
          <div className="space-y-0.5 font-mono text-xs text-gray-400">
            {sub.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ count, text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.03] px-4 py-3 text-sm text-gray-300">
        <NeonLines />
        <div className="relative z-10">
          <p>
            Found{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-2xl font-bold text-transparent">
              {count.toLocaleString()}
            </span>{' '}
            {text}
          </p>
          <p className="mt-1 text-xs text-gray-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalCard() {
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative overflow-hidden rounded-2xl rounded-tl-sm border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.03] px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="h-4 w-4 text-amber-400" />
          </motion.div>
          <span className="font-semibold text-amber-300">{steps[4].text}</span>
          <motion.div
            className="h-2 w-2 rounded-full bg-amber-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}

function ArchitectureFlow({ activeNode, nodes }) {
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.03] px-4 py-4">
        <NeonLines />
        <p className="relative z-10 mb-3 text-xs font-semibold text-cyan-400">Campaign Launch Pipeline</p>
        <div className="relative z-10 flex flex-col items-center gap-1">
          {nodes.map((node, i) => {
            const isActive = i <= activeNode;
            const isCurrent = i === activeNode;
            return (
              <div key={i} className="flex flex-col items-center">
                <motion.div
                  className={`relative rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors duration-300 ${
                    isActive
                      ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      : 'border border-white/[0.06] bg-white/[0.03] text-gray-500'
                  }`}
                  animate={isCurrent ? { boxShadow: ['0 0 0px #22d3ee00', '0 0 12px #22d3ee40', '0 0 0px #22d3ee00'] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {node}
                </motion.div>
                {i < nodes.length - 1 && (
                  <div className="flex flex-col items-center py-0.5">
                    <motion.div
                      className={`h-3 w-px ${isActive ? 'bg-cyan-500/50' : 'bg-white/[0.06]'}`}
                      animate={i < activeNode ? { opacity: [0.3, 1, 0.3] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {i < activeNode && (
                      <motion.div
                        className="h-1 w-1 rounded-full bg-cyan-400"
                        animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LaunchCard({ text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-cyan-500/[0.03] px-4 py-3 text-sm text-gray-300">
        <NeonLines />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Check className="h-4 w-4 text-emerald-400" />
            </motion.div>
            <span className="font-semibold text-emerald-300">{text}</span>
          </div>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function LiveTimeline({ activeStage }) {
  const stages = steps[8].stages;
  return (
    <div className="flex items-start gap-3">
      <AIAvatar />
      <div className="relative max-w-[85%] overflow-hidden rounded-2xl rounded-tl-sm border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.03] px-4 py-4">
        <NeonLines />
        <p className="relative z-10 mb-3 text-xs font-semibold text-cyan-400">Live Tracking</p>
        <div className="relative z-10 flex items-center justify-between">
          {stages.map((stage, i) => {
            const isActive = i <= activeStage;
            const isCurrent = i === activeStage;
            return (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-300 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30'
                        : 'bg-white/[0.04] text-gray-600 ring-1 ring-white/[0.06]'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {i + 1}
                  </motion.div>
                  <span className={`text-[9px] ${isActive ? 'text-cyan-300' : 'text-gray-600'}`}>{stage}</span>
                </div>
                {i < stages.length - 1 && (
                  <motion.div
                    className={`mx-1 h-px w-4 ${i < activeStage ? 'bg-cyan-500/50' : 'bg-white/[0.06]'}`}
                    animate={i < activeStage ? { opacity: [0.3, 1, 0.3] } : {}}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AgentConversationFlow({ autoPlay = true, loop = true, speed = 1 }) {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const [archNode, setArchNode] = useState(-1);
  const [timelineStage, setTimelineStage] = useState(-1);
  const [timelineLoop, setTimelineLoop] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-50px' });
  const timeoutRef = useRef(null);
  const archIntervalRef = useRef(null);
  const timelineIntervalRef = useRef(null);

  const reset = useCallback(() => {
    setVisibleSteps([]);
    setCurrentStep(0);
    setArchNode(-1);
    setTimelineStage(-1);
    setTimelineLoop(0);
    setIsPaused(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (archIntervalRef.current) clearInterval(archIntervalRef.current);
    if (timelineIntervalRef.current) clearInterval(timelineIntervalRef.current);
  }, []);

  const playStep = useCallback((stepIndex) => {
    if (stepIndex >= steps.length) {
      if (loop) {
        timeoutRef.current = setTimeout(() => {
          reset();
          timeoutRef.current = setTimeout(() => playStep(0), 600);
        }, 2000);
      }
      return;
    }

    const step = steps[stepIndex];

    if (step.type === 'architecture') {
      setVisibleSteps(prev => [...prev, { ...step, archNode: -1 }]);
      let node = 0;
      archIntervalRef.current = setInterval(() => {
        if (node >= step.nodes.length) {
          clearInterval(archIntervalRef.current);
          setArchNode(-1);
          timeoutRef.current = setTimeout(() => playStep(stepIndex + 1), 800);
          return;
        }
        setArchNode(node);
        node++;
      }, 350 / speed);
      return;
    }

    if (step.type === 'timeline') {
      setVisibleSteps(prev => [...prev, { ...step, timelineStage: -1 }]);
      let stage = 0;
      const advance = () => {
        if (stage >= step.stages.length) {
          setTimelineLoop(prev => prev + 1);
          stage = 0;
          setTimelineStage(0);
          timelineIntervalRef.current = setTimeout(advance, 400 / speed);
          return;
        }
        setTimelineStage(stage);
        stage++;
        timelineIntervalRef.current = setTimeout(advance, 600 / speed);
      };
      timelineIntervalRef.current = setTimeout(advance, 300 / speed);
      return;
    }

    setVisibleSteps(prev => [...prev, step]);

    const duration = step.type === 'ai-thinking' ? STEP_DURATION_BASE * 1.2 / speed : STEP_DURATION_BASE / speed;
    timeoutRef.current = setTimeout(() => playStep(stepIndex + 1), duration);
  }, [speed, loop, reset]);

  useEffect(() => {
    if (isPlaying && isInView && !isPaused) {
      reset();
      timeoutRef.current = setTimeout(() => playStep(0), 500);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (archIntervalRef.current) clearInterval(archIntervalRef.current);
      if (timelineIntervalRef.current) clearTimeout(timelineIntervalRef.current);
    };
  }, [isPlaying, isInView, isPaused, playStep, reset]);

  const handlePause = () => {
    setIsPaused(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (archIntervalRef.current) clearInterval(archIntervalRef.current);
    if (timelineIntervalRef.current) clearTimeout(timelineIntervalRef.current);
  };

  const handleResume = () => {
    setIsPaused(false);
    if (visibleSteps.length > 0) {
      const lastStep = visibleSteps[visibleSteps.length - 1];
      const lastIdx = steps.findIndex(s => s.id === lastStep.id);
      if (lastStep.type === 'architecture') {
        playStep(lastIdx + 1);
      } else if (lastStep.type === 'timeline') {
        // Keep timeline looping
      } else {
        playStep(lastIdx + 1);
      }
    } else {
      playStep(0);
    }
  };

  const renderStep = (step, idx) => {
    const anim = {
      initial: { opacity: 0, y: 20, scale: 0.97 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    };

    switch (step.type) {
      case 'user-message':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <MessageCard text={step.text} />
          </motion.div>
        );
      case 'ai-thinking':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <MessageCard isAI>
              <div className="flex items-center gap-2">
                <TypingIndicator />
                <span className="text-xs text-gray-400">{step.text}</span>
              </div>
            </MessageCard>
          </motion.div>
        );
      case 'workflow':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <WorkflowCard text={step.text} sub={step.sub} />
          </motion.div>
        );
      case 'ai-result':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <ResultCard count={step.count} text={step.text} sub={step.sub} />
          </motion.div>
        );
      case 'approval':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <ApprovalCard />
          </motion.div>
        );
      case 'architecture':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <ArchitectureFlow activeNode={archNode} nodes={step.nodes} />
          </motion.div>
        );
      case 'launch':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <LaunchCard text={step.text} sub={step.sub} />
          </motion.div>
        );
      case 'timeline':
        return (
          <motion.div key={`step-${idx}`} {...anim} layout>
            <LiveTimeline activeStage={timelineStage} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="relative h-full">
      {/* Controls */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
        {isPaused ? (
          <button onClick={handleResume} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400">
            <Play className="h-3 w-3" />
          </button>
        ) : (
          <button onClick={handlePause} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400">
            <Pause className="h-3 w-3" />
          </button>
        )}
        <button onClick={() => { reset(); setIsPlaying(true); setIsPaused(false); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-400">
          <RotateCcw className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5">
          <Zap className="h-2.5 w-2.5 text-gray-500" />
          {[0.5, 1, 2].map(s => (
            <button
              key={s}
              onClick={() => { reset(); setIsPlaying(true); }}
              className={`rounded px-1 text-[9px] font-medium transition-colors ${
                speed === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
        <AnimatePresence mode="popLayout">
          {visibleSteps.map((step, idx) => renderStep(step, idx))}
        </AnimatePresence>

        {visibleSteps.length === 0 && !isPaused && (
          <motion.div
            className="flex h-full items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="h-8 w-8" />
              </motion.div>
              <p className="text-xs">Initializing AI Agent...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
