import type { AgentInfo } from "../types";

const roleColors = {
  requester: { bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500", text: "text-purple-400" },
  worker: { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500", text: "text-blue-400" },
};

interface Props {
  agent: AgentInfo;
  isActive: boolean;
}

export function AgentCard({ agent, isActive }: Props) {
  const c = roleColors[agent.role];

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-300 ${c.bg} ${c.border} ${
        isActive ? "animate-pulse-glow ring-1 ring-purple-500/40" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${c.dot} ${isActive ? "animate-pulse" : ""}`} />
        <h3 className="text-lg font-semibold">{agent.name}</h3>
        <span
          className={`ml-auto text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}
        >
          {agent.role}
        </span>
      </div>

      {/* Address */}
      <div className="mb-3">
        <span className="text-xs text-[var(--text-secondary)]">Wallet</span>
        <p className="text-sm font-mono text-[var(--text-secondary)] truncate">
          {agent.address}
        </p>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <span className="text-xs text-[var(--text-secondary)]">Balance</span>
        <p className="text-2xl font-bold">
          {agent.balance} <span className="text-sm font-normal text-[var(--text-secondary)]">MON</span>
        </p>
      </div>

      {/* Skills */}
      <div>
        <span className="text-xs text-[var(--text-secondary)] block mb-2">Skills</span>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs font-mono bg-white/5 border border-white/10 rounded-md px-2 py-1"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
