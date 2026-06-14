import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Gauge,
  Users,
  PenLine,
  GitFork,
  Bot,
  Check,
  Sparkles,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Zap,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { GlassButton } from '../components/ui/glass-button';
import { GlassCard, GlassCardContent, GlassCardTitle } from '../components/ui/glass-card';
import { GlassBadge } from '../components/ui/glass-badge';
import { GlassAvatar } from '../components/ui/glass-avatar';
import { GlassSeparator } from '../components/glass-separator';

const FEATURES = [
  { icon: FileSpreadsheet, title: 'CSV Import', desc: 'Drop a CSV and start. Fuzzy column mapping and per-row validation mean messy exports just work.' },
  { icon: Gauge, title: 'Health Scoring', desc: 'Every customer is auto-scored — loyal, regular, at-risk, churning, new — from recency, frequency & spend.' },
  { icon: Users, title: 'Natural-Language Segments', desc: '"Customers in Delhi who spent over ₹5,000." The AI compiles plain English into a precise audience.' },
  { icon: PenLine, title: 'AI Message Drafting', desc: 'On-brand copy generated per segment and per channel — ready to review before anything sends.' },
  { icon: GitFork, title: 'Per-Customer Routing', desc: 'The AI picks WhatsApp, SMS, or Email individually, per recipient, from engagement patterns.' },
  { icon: Bot, title: 'Autonomous AI Agent', desc: 'Full CRM access with confirmation gates before any action. Ask questions, run scans, launch campaigns.' },
];

const STEPS = [
  { label: 'Import', desc: 'Upload customer data via CSV or API.', icon: FileSpreadsheet, color: '#06b6d4', glow: 'cyan' },
  { label: 'Score', desc: 'AI auto-scores health & value.', icon: Gauge, color: '#8b5cf6', glow: 'violet' },
  { label: 'Segment', desc: 'Define audiences in plain English.', icon: Users, color: '#ec4899', glow: 'pink' },
  { label: 'Draft', desc: 'AI writes on-brand messages.', icon: PenLine, color: '#f59e0b', glow: 'amber' },
  { label: 'Route', desc: 'Best channel picked per customer.', icon: GitFork, color: '#10b981', glow: 'emerald' },
  { label: 'Launch', desc: 'Campaign goes live, tracked in real-time.', icon: Zap, color: '#3b82f6', glow: 'blue' },
  { label: 'Attribute', desc: 'Revenue traced to each campaign.', icon: BarChart3, color: '#f43f5e', glow: 'rose' },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="relative w-full bg-[#09090b] text-white">
      {/* Header */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl' : 'bg-transparent'}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-lg font-semibold tracking-tight text-white">Xeno</span>
            <GlassBadge variant="outline" size="sm" className="text-[9px] uppercase tracking-[0.3em]">CRM</GlassBadge>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {['How it works', 'Features', 'AI Agent'].map(t => (
              <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-').replace('ai-agent', 'agent')}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">{t}</a>
            ))}
            <Link to="/docs" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">Docs</Link>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/dashboard">
              <GlassButton variant="primary" size="sm" glowEffect>Enter the CRM</GlassButton>
            </Link>
          </div>
          <button className="rounded-lg p-2 text-white md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
        {mobileOpen && (
          <div className="border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 px-5 py-4">
              {['How it works', 'Features', 'AI Agent'].map(t => (
                <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-').replace('ai-agent', 'agent')}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">{t}</a>
              ))}
              <Link to="/docs" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">Docs</Link>
              <div className="mt-2"><Link to="/dashboard"><GlassButton variant="primary" size="sm" glowEffect>Enter the CRM</GlassButton></Link></div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        >
          <source src="/Neon_line_morphing_SaaS_shapes_202606142120.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#09090b]/60" />

        <motion.div className="relative z-10 mx-auto max-w-3xl text-center" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-6">
            <GlassBadge variant="primary">
              <span className="relative mr-2 flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/30 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              AI-Powered CRM
            </GlassBadge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mb-6 text-5xl font-light leading-[0.9] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="font-serif italic">AI runs your</span><br />
            <span className="font-serif italic">campaigns</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-md text-sm font-light leading-relaxed text-gray-400 sm:text-base">
            Segment customers in plain English, draft on-brand messages, pick the best channel, and launch — all autonomous.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link to="/dashboard">
              <GlassButton variant="primary" size="lg" glowEffect><Zap className="h-4 w-4" /> Enter the CRM</GlassButton>
            </Link>
            <a href="#how" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 transition-colors hover:text-white">See how it works →</a>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center gap-2.5">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/30 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-500/70">System Online</p>
          </motion.div>
        </motion.div>
        <div className="pointer-events-none absolute bottom-8 left-0 flex w-full justify-center">
          <p className="relative z-10 text-[9px] uppercase tracking-[0.4em] text-gray-600">WhatsApp · SMS · Email · RCS</p>
        </div>
      </section>

      {/* Main content */}
      <main className="relative z-10">
        {/* Tech Stack */}
        <section className="border-y border-white/[0.06] py-8">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500">Built on a modern stack</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {['React', 'Node.js', 'MongoDB', 'FastAPI', 'CrewAI', 'Tailwind'].map(t => (
                <span key={t} className="text-lg font-semibold tracking-tight text-gray-600">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="scroll-mt-24 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div className="mx-auto max-w-2xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
              <GlassBadge variant="primary" className="mb-4">How it works</GlassBadge>
              <h2 className="font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl md:text-6xl">From a CSV to a launched campaign</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">Your data flows through one autonomous pipeline — seven stages, most of them hands-off.</p>
            </motion.div>

            {/* Neon Pipeline Flowchart */}
            <motion.div
              className="relative mx-auto mt-16 max-w-5xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={stagger}
            >
              {/* Animated connecting line */}
              <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 lg:block">
                <div className="h-full w-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0" />
                <div className="absolute inset-0 h-full w-full animate-[pulse_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7 lg:gap-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.label}
                      variants={fadeUp}
                      className="group relative flex flex-col items-center text-center"
                    >
                      {/* Neon Glow Card */}
                      <div
                        className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all duration-500 sm:h-24 sm:w-24"
                        style={{
                          borderColor: `${step.color}40`,
                          boxShadow: `0 0 15px ${step.color}20, inset 0 0 15px ${step.color}10`,
                        }}
                      >
                        {/* Animated neon pulse ring */}
                        <div
                          className="absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(135deg, ${step.color}30, transparent, ${step.color}20)`,
                            filter: 'blur(8px)',
                          }}
                        />
                        {/* Rotating border glow */}
                        <div
                          className="absolute -inset-0.5 rounded-2xl opacity-50"
                          style={{
                            background: `conic-gradient(from ${i * 51.4}deg, transparent, ${step.color}60, transparent, ${step.color}30, transparent)`,
                            filter: 'blur(4px)',
                            animation: 'spin 6s linear infinite',
                          }}
                        />
                        <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-[#09090b]/80 backdrop-blur-sm">
                          <Icon
                            className="h-7 w-7 transition-transform duration-300 group-hover:scale-110"
                            style={{ color: step.color }}
                          />
                        </div>
                      </div>

                      {/* Step number */}
                      <div
                        className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${step.color}20`,
                          color: step.color,
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Label */}
                      <h4 className="text-xs font-semibold text-white sm:text-sm">{step.label}</h4>
                      <p className="mt-1 hidden text-[11px] leading-tight text-gray-500 sm:block">{step.desc}</p>

                      {/* Arrow to next (hidden on last) */}
                      {i < STEPS.length - 1 && (
                        <div className="absolute right-0 top-10 hidden -translate-y-1/2 translate-x-full lg:block">
                          <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                            <path
                              d="M0 6H20M20 6L16 2M20 6L16 10"
                              stroke={`${step.color}`}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.5"
                            />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Center AI Hub */}
              <motion.div variants={fadeUp} className="mt-10 flex justify-center lg:mt-6">
                <div className="relative group">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-pink-500/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Xeno AI Pipeline</p>
                      <p className="text-[10px] text-gray-500">Autonomous end-to-end orchestration</p>
                    </div>
                    <div className="ml-2 flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mobile: Vertical flow */}
              <div className="mt-8 flex flex-col items-center gap-2 lg:hidden">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border-2"
                        style={{
                          borderColor: `${step.color}40`,
                          boxShadow: `0 0 10px ${step.color}15`,
                        }}
                      >
                        <Icon className="h-4 w-4" style={{ color: step.color }} />
                      </div>
                      <span className="text-sm text-gray-300">{step.label}</span>
                      {i < STEPS.length - 1 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
                          <path d="M8 3V13M8 13L5 10M8 13L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Add keyframes for spin */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </section>

        {/* See It In Action */}
        <section className="relative w-full py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div className="mx-auto max-w-2xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
              <GlassBadge variant="primary" className="mb-4">Live Demo</GlassBadge>
              <h2 className="font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl md:text-6xl">See it in action</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">Watch how Xeno turns raw customer data into a fully launched, AI-optimized campaign — end to end.</p>
            </motion.div>
          </div>

          {/* Full-width video */}
          <motion.div
            className="relative mt-10 w-full"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp}
          >
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/40">
              {/* Neon glow behind video */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-pink-500/20 blur-xl opacity-60" />
              <div className="relative">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-auto w-full object-cover"
                  style={{ aspectRatio: '16/9' }}
                >
                  <source src="/app working.mp4" type="video/mp4" />
                </video>
                {/* Top gradient fade */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#09090b] to-transparent" />
                {/* Bottom gradient fade */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#09090b] to-transparent" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <motion.div className="mx-auto max-w-2xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
              <GlassBadge variant="primary" className="mb-4">Features</GlassBadge>
              <h2 className="font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl md:text-6xl">Everything you need to grow</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">A complete AI-native CRM loop — from ingestion to attribution — that works while you sleep.</p>
            </motion.div>
            <motion.div className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              {FEATURES.map(f => (
                <motion.div key={f.title} variants={fadeUp}>
                  <GlassCard className="h-full p-6 transition-all duration-300 hover:border-cyan-400/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-transform duration-300 group-hover:scale-110">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* AI Agent */}
        <section id="agent" className="scroll-mt-24 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <GlassBadge variant="primary" className="mb-4">AI Command Center</GlassBadge>
              <motion.h2 variants={fadeUp} className="font-serif text-4xl font-light leading-tight tracking-tight sm:text-5xl md:text-6xl">An agent that does the work</motion.h2>
              <motion.p variants={fadeUp} className="mt-4 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
                Tell it a goal in plain language. It queries your data, builds the segment, drafts the messages, picks the channel, and launches — pausing for your approval.
              </motion.p>
              <motion.ul variants={fadeUp} className="mt-7 space-y-3">
                {['Natural language campaign creation', 'AI-driven opportunity scanning', 'Automatic audience segmentation', 'Multi-channel message optimization'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />{item}
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp} className="mt-8">
                <Link to="/dashboard"><GlassButton variant="primary" glowEffect><MessageSquare className="h-4 w-4" /> Try the AI Agent</GlassButton></Link>
              </motion.div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <GlassCard className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GlassAvatar className="h-8 w-8 flex-shrink-0"><div className="flex h-full w-full items-center justify-center bg-cyan-500/20 text-xs font-bold text-cyan-400">U</div></GlassAvatar>
                    <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm text-gray-300">Find all customers in Mumbai who haven't ordered in 60 days and send them a win-back offer.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GlassAvatar className="h-8 w-8 flex-shrink-0"><Bot className="h-4 w-4 text-violet-400" /></GlassAvatar>
                    <div className="rounded-2xl rounded-tl-sm bg-cyan-500/5 border border-cyan-400/10 px-4 py-3 text-sm text-gray-300">
                      <p className="mb-2 text-xs font-semibold text-cyan-400">AI Agent</p>
                      <p>Found <span className="font-semibold text-white">847 customers</span> matching your criteria.</p>
                      <p className="mt-1">Segment created. Drafting win-back messages...</p>
                      <div className="mt-3"><GlassBadge variant="success" size="sm"><Shield className="mr-1 h-3 w-3" /> Awaiting approval</GlassBadge></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GlassAvatar className="h-8 w-8 flex-shrink-0"><div className="flex h-full w-full items-center justify-center bg-cyan-500/20 text-xs font-bold text-cyan-400">U</div></GlassAvatar>
                    <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm text-gray-300">Approved. Launch it.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GlassAvatar className="h-8 w-8 flex-shrink-0"><Bot className="h-4 w-4 text-violet-400" /></GlassAvatar>
                    <div className="rounded-2xl rounded-tl-sm bg-cyan-500/5 border border-cyan-400/10 px-4 py-3 text-sm text-gray-300">
                      <p>Campaign <span className="font-semibold text-white">"Win-Back Mumbai"</span> launched.</p>
                      <p className="mt-1">847 messages queued across 2 channels. Tracking live →</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <GlassCard className="relative overflow-hidden px-8 py-16 text-center sm:px-16">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
              <div className="relative z-10">
                <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">Ready to let AI run your CRM?</h2>
                <p className="mx-auto mt-4 max-w-md text-sm text-gray-400 sm:text-base">Start with a free account. No credit card required.</p>
                <div className="mt-8">
                  <Link to="/dashboard"><GlassButton variant="primary" size="lg" glowEffect><ArrowRight className="h-4 w-4" /> Get Started Free</GlassButton></Link>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-white">Xeno</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500">CRM</span>
            </div>
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Xeno CRM. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#features" className="text-xs text-gray-500 transition-colors hover:text-white">Features</a>
              <a href="#how" className="text-xs text-gray-500 transition-colors hover:text-white">How it works</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
