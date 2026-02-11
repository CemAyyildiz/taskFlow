import { motion } from "framer-motion";

const layers = [
  {
    tag: "01",
    title: "AGENT LAYER",
    ascii: "▓▓▓",
    color: "var(--mon-purple-glow)",
    description:
      "Requester & Worker agents — autonomous EventEmitter-based entities with registered skill functions.",
    items: ["RequesterAgent", "WorkerAgent", "Skill Registry", "Event Bus"],
  },
  {
    tag: "02",
    title: "COMMUNICATION",
    ascii: ">>>",
    color: "var(--mon-cyan)",
    description:
      "Agents communicate via typed events — no REST, no WebSocket, just in-process pub/sub.",
    items: ["task:created", "task:accepted", "task:completed", "payment:sent"],
  },
  {
    tag: "03",
    title: "DATA LAYER",
    ascii: "[=]",
    color: "var(--mon-yellow)",
    description:
      "In-memory TaskStore backed by a Map — no DB, no persistence. MVP-grade simplicity.",
    items: ["TaskStore (Map)", "Task type", "Status FSM", "Singleton"],
  },
  {
    tag: "04",
    title: "BLOCKCHAIN",
    ascii: "◆◆◆",
    color: "var(--mon-green)",
    description:
      "Native MON transfers via viem on Monad Testnet. EVM-compatible, 400ms blocks, near-zero fees.",
    items: ["Monad Testnet", "viem", "Native MON", "21k gas"],
  },
];

export function Architecture() {
  return (
    <section className="py-28 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-pixel text-[10px] text-[var(--mon-green)] mb-3">
            // ARCHITECTURE
          </p>
          <h2 className="font-pixel text-lg md:text-xl text-[var(--mon-text)] mb-2">
            SYSTEM LAYERS
          </h2>
          <p className="text-sm text-[var(--mon-text-dim)]">
            Four clean layers. No over-engineering.
          </p>
        </motion.div>

        {/* ASCII stack diagram */}
        <motion.pre
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] md:text-xs text-[var(--mon-text-dim)] mb-10 leading-relaxed select-none hidden md:block"
        >
{`  ┌─────────────────────────────────────────────┐
  │  ▓▓ RequesterAgent    ░░ WorkerAgent        │  AGENT LAYER
  ├─────────────────────────────────────────────┤
  │  EventEmitter  →  task:* / payment:*        │  COMMUNICATION
  ├─────────────────────────────────────────────┤
  │  TaskStore (Map)  │  Status FSM             │  DATA LAYER
  ├─────────────────────────────────────────────┤
  │  viem  →  Monad Testnet  │  sendMON()       │  BLOCKCHAIN
  └─────────────────────────────────────────────┘`}
        </motion.pre>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.tag}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="retro-box rounded-lg p-5 hover:glow-border transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-pixel text-sm"
                  style={{ color: layer.color }}
                >
                  {layer.ascii}
                </span>
                <div>
                  <span className="text-[9px] text-[var(--mon-text-dim)]">
                    [{layer.tag}]
                  </span>
                  <h3
                    className="font-pixel text-[9px] leading-tight"
                    style={{ color: layer.color }}
                  >
                    {layer.title}
                  </h3>
                </div>
              </div>
              <p className="text-[11px] text-[var(--mon-text-dim)] leading-relaxed mb-3">
                {layer.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {layer.items.map((item) => (
                  <span
                    key={item}
                    className="text-[9px] font-mono bg-[var(--mon-darker)] border border-[var(--mon-border)] rounded px-2 py-0.5 text-[var(--mon-text-dim)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
