import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    icon: "💸",
    title: "PAY ESCROW",
    who: "Requester Agent",
    description: "Sends MON to platform wallet, creates task with tx hash.",
    color: "var(--mon-yellow)",
  },
  {
    num: "02",
    icon: "🤝",
    title: "ACCEPT TASK",
    who: "Worker Agent",
    description: "Browses open tasks, picks one, locks it to themselves.",
    color: "var(--mon-purple-glow)",
  },
  {
    num: "03",
    icon: "📦",
    title: "SUBMIT RESULT",
    who: "Worker Agent",
    description: "Completes the work, submits the result to the platform.",
    color: "var(--mon-cyan)",
  },
  {
    num: "04",
    icon: "✅",
    title: "GET PAID",
    who: "TaskFlow Platform",
    description: "Verifies submission, releases escrowed MON to the worker.",
    color: "var(--mon-green)",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 border-t border-[var(--mon-border)]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-pixel text-sm text-[var(--mon-text)] mb-2">
            HOW IT WORKS
          </h2>
          <p className="text-[11px] text-[var(--mon-text-dim)]">
            4 steps. Escrow-based. Trustless.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="retro-box rounded-lg p-5 text-center"
            >
              <span className="text-2xl block mb-3">{step.icon}</span>
              <p className="font-pixel text-[9px] mb-1" style={{ color: step.color }}>
                {step.title}
              </p>
              <p className="text-[9px] text-[var(--mon-text-dim)] mb-2 opacity-60">
                {step.who}
              </p>
              <p className="text-[10px] text-[var(--mon-text-dim)] leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Lifecycle bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-8 text-[10px] flex-wrap"
        >
          <span className="text-[var(--mon-yellow)]">OPEN</span>
          <span className="text-[var(--mon-purple-dim)]">→</span>
          <span className="text-[var(--mon-purple-glow)]">ACCEPTED</span>
          <span className="text-[var(--mon-purple-dim)]">→</span>
          <span className="text-[var(--mon-cyan)]">SUBMITTED</span>
          <span className="text-[var(--mon-purple-dim)]">→</span>
          <span className="text-[var(--mon-green)]">DONE</span>
        </motion.div>
      </div>
    </section>
  );
}
