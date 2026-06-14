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
  { label: 'Import', desc: 'Upload your customer data via CSV or API.' },
  { label: 'Score', desc: 'AI auto-scores every customer on health & value.' },
  { label: 'Segment', desc: 'Define audiences in plain English or with rules.' },
  { label: 'Draft', desc: 'AI writes on-brand messages for each channel.' },
  { label: 'Route', desc: 'Best channel picked per customer automatically.' },
  { label: 'Launch', desc: 'Campaign goes live with real-time tracking.' },
  { label: 'Attribute', desc: 'Revenue & engagement traced back to each campaign.' },
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
            <div className="mx-auto mt-12 grid max-w-3xl gap-8 lg:grid-cols-2">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                {STEPS.map((step, i) => (
                  <motion.div key={step.label} variants={fadeUp} className="relative flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-xs font-bold text-cyan-400">{i + 1}</div>
                      {i < STEPS.length - 1 && <div className="mt-2 h-8 w-px bg-gradient-to-b from-cyan-500/30 to-transparent" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="text-sm font-semibold text-white">{step.label}</h4>
                      <p className="mt-1 text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div className="hidden items-center justify-center lg:flex" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <GlassCard className="p-8">
                  <div className="flex flex-col items-center gap-3">
                    {STEPS.map((step, i) => (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/5 text-xs font-bold text-cyan-400 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10">{i + 1}</div>
                        <span className="text-sm text-gray-400">{step.label}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10">
                      <Sparkles className="h-6 w-6 text-cyan-400" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/70">Xeno AI</span>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
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
