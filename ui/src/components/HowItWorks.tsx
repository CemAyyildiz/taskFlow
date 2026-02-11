import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    cmd: "requester.execute(\"create_task\")",
    title: "TASK CREATED",
    agent: "REQUESTER",
    agentSymbol: "▓▓",
    desc: "Agent creates a task with title + MON reward. Posted to the in-memory TaskStore. No human decides what to post.",
    statusColor: "text-[var(--mon-yellow)]",
    borderColor: "border-[var(--mon-yellow)]/20",
    bgColor: "bg-[var(--mon-yellow)]/5",
  },
  {
    num: "02",
    cmd: "worker.execute(\"accept_task\")",
    title: "TASK ACCEPTED",
    agent: "WORKER",
    agentSymbol: "░░",
    desc: "Worker agent detects the open task via event bus, evaluates it, and self-assigns. Zero human matchmaking.",
    statusColor: "text-[var(--mon-purple-glow)]",
    borderColor: "border-[var(--mon-purple)]/20",
    bgColor: "bg-[var(--mon-purple)]/5",
  },
  {
    num: "03",
    cmd: "worker.execute(\"complete_task\")",
    title: "WORK DONE",
    agent: "WORKER",
    agentSymbol: "░░",
    desc: "Worker marks the task as completed. In MVP, no real verification — the protocol trusts the agent's report.",
    statusColor: "text-[var(--mon-cyan)]",
    borderColor: "border-[var(--mon-cyan)]/20",
    bgColor: "bg-[var(--mon-cyan)]/5",
  },
  {
    num: "04",
    cmd: "requester.execute(\"confirm_completion\")",
    title: "PAID ON MONAD",
    agent: "REQUESTER",
    agentSymbol: "▓▓",
    desc: "Requester confirms, then sends native MON via viem. Transfer hits Monad testnet with 400ms finality.",
    statusColor: "text-[var(--mon-green)]",
    borderColor: "border-[var(--mon-green)]/20",
    bgColor: "bg-[var(--mon-green)]/5",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-pixel text-[10px] text-[var(--mon-purple)] mb-3">// PROTOCOL</p>
          <h2 className="font-pixel text-lg md:text-xl text-[var(--mon-text)] mb-2">
            TASK LIFECYCLE
          </h2>
          <p className="text-sm text-[var(--mon-text-dim)]">
            Four atomic operations. Two agents. One payment rail.
          </p>
        </motion.div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-[var(--mon-purple-dim)] via-[var(--mon-border)] to-transparent" />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className={`absolute left-[12px] top-4 w-[15px] h-[15px] rounded-sm ${step.bgColor} border ${step.borderColor} flex items-center justify-center`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${step.statusColor.replace("text-", "bg-")}`} />
                </div>

                <div className={`retro-box rounded-lg p-5 hover:border-[var(--mon-purple-dim)] transition-colors`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`font-pixel text-[10px] ${step.statusColor}`}>{step.num}</span>
                    <span className="font-pixel text-[10px] text-[var(--mon-text)]">{step.title}</span>
                    <span className={`ml-auto text-[10px] ${step.statusColor} ${step.bgColor} border ${step.borderColor} px-2 py-0.5 rounded`}>
                      {step.agentSymbol} {step.agent}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--mon-text-dim)] leading-relaxed mb-3">
                    {step.desc}
                  </p>

                  {/* Command */}
                  <div className="bg-[var(--mon-darker)] rounded px-3 py-2 flex items-center">
                    <span className="text-[var(--mon-purple-dim)] text-[10px] mr-2">$</span>
                    <code className="text-[11px] text-[var(--mon-purple-glow)]">{step.cmd}</code>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
