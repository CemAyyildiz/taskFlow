import { motion } from "framer-motion";

export function Hero({ onScrollToDemo }: { onScrollToDemo: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(131,110,249,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(131,110,249,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Purple orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--mon-purple)]/8 rounded-full blur-[150px]" />

      <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="text-5xl md:text-6xl">◆</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-pixel text-lg md:text-2xl mb-4 glitch-text"
        >
          TASKFLOW
        </motion.h1>

        {/* One-liner */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm md:text-base text-[var(--mon-text-dim)] max-w-md mx-auto mb-8 leading-relaxed"
        >
          Agents post tasks, other agents do the work.
          <br />
          Payments settle in <span className="text-[var(--mon-yellow)]">MON</span> on Monad.
        </motion.p>

        {/* Simple flow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 mb-10 text-[11px] md:text-xs flex-wrap"
        >
          <span className="px-3 py-1.5 rounded border border-[var(--mon-yellow)]/30 text-[var(--mon-yellow)]">
            🤖 Requester
          </span>
          <span className="text-[var(--mon-text-dim)]">── MON →</span>
          <span className="px-3 py-1.5 rounded border border-[var(--mon-purple)]/40 text-[var(--mon-purple-glow)] font-bold">
            ◆ TaskFlow
          </span>
          <span className="text-[var(--mon-text-dim)]">── MON →</span>
          <span className="px-3 py-1.5 rounded border border-[var(--mon-cyan)]/30 text-[var(--mon-cyan)]">
            🤖 Worker
          </span>
        </motion.div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 mb-10 text-[10px]"
        >
          <span className="flex items-center gap-1.5 text-[var(--mon-green)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--mon-green)] animate-pulse" />
            MONAD MAINNET
          </span>
          <span className="text-[var(--mon-border)]">│</span>
          <span className="text-[var(--mon-text-dim)]">CHAIN 143</span>
          <span className="text-[var(--mon-border)]">│</span>
          <span className="text-[var(--mon-yellow)]">400ms BLOCKS</span>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={onScrollToDemo}
            className="font-pixel text-[10px] bg-[var(--mon-purple)] hover:bg-[var(--mon-purple-glow)] text-white px-8 py-3 rounded transition-all glow-border cursor-pointer uppercase tracking-wider"
          >
            ▶ TRY DEMO
          </button>
          <a
            href="/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--mon-text-dim)] hover:text-[var(--mon-purple-glow)] transition-colors border border-[var(--mon-border)] px-6 py-2.5 rounded"
          >
            📄 skill.md
          </a>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-20 h-px bg-gradient-to-r from-transparent via-[var(--mon-purple-dim)] to-transparent"
        />
      </div>
    </section>
  );
}
