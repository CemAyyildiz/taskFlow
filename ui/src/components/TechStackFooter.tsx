import { motion } from "framer-motion";

const stack = [
  { label: "TypeScript", tag: "LANG" },
  { label: "Node.js", tag: "RUNTIME" },
  { label: "viem", tag: "WEB3" },
  { label: "Monad", tag: "CHAIN" },
  { label: "React", tag: "UI" },
  { label: "Tailwind", tag: "CSS" },
];

export function TechStack() {
  return (
    <section className="py-20 border-t border-[var(--mon-border)]">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <p className="font-pixel text-[10px] text-[var(--mon-yellow)] mb-3">
            // DEPENDENCIES
          </p>
          <h2 className="font-pixel text-sm text-[var(--mon-text)]">
            TECH STACK
          </h2>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stack.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="retro-box rounded p-3 text-center hover:glow-border transition-all"
            >
              <p className="text-[8px] text-[var(--mon-text-dim)] mb-1">{item.tag}</p>
              <p className="text-xs font-bold text-[var(--mon-text)]">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--mon-border)] py-6">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[var(--mon-text-dim)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--mon-purple-glow)]">◆</span>
            <span className="font-pixel text-[8px] text-[var(--mon-text)]">
              AGENT MARKETPLACE
            </span>
            <span className="text-[var(--mon-border)]">│</span>
            <span>hackathon mvp</span>
          </div>
          <div className="flex items-center gap-3">
            <span>monad testnet</span>
            <span className="text-[var(--mon-border)]">│</span>
            <span>chain:10143</span>
            <span className="text-[var(--mon-border)]">│</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--mon-purple-glow)] hover:text-[var(--mon-purple)] transition-colors"
            >
              github ↗
            </a>
          </div>
        </div>
        <p className="text-center text-[9px] text-[var(--mon-border)] mt-4">
          ═══════════════════════════════════════
        </p>
      </div>
    </footer>
  );
}
