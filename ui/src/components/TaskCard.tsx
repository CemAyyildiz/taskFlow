import { TaskStatus, type Task } from "../types";

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  [TaskStatus.Open]: { label: "OPEN", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  [TaskStatus.Accepted]: { label: "ACCEPTED", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  [TaskStatus.Completed]: { label: "COMPLETED", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  [TaskStatus.Confirmed]: { label: "CONFIRMED", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  [TaskStatus.Paid]: { label: "PAID ✓", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
};

interface Props {
  task: Task | null;
}

export function TaskCard({ task }: Props) {
  if (!task) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-[var(--text-secondary)] text-sm">No task yet — run the demo to create one</p>
      </div>
    );
  }

  const s = statusConfig[task.status];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-slide-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-1">Task ID: {task.id}</p>
          <h3 className="text-lg font-semibold">{task.title}</h3>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${s.bg} ${s.color}`}>
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <span className="text-xs text-[var(--text-secondary)]">Reward</span>
          <p className="text-xl font-bold text-green-400">{task.reward} MON</p>
        </div>
        <div>
          <span className="text-xs text-[var(--text-secondary)]">Requester</span>
          <p className="text-sm font-mono text-[var(--text-secondary)] truncate">{task.requester}</p>
        </div>
        <div>
          <span className="text-xs text-[var(--text-secondary)]">Worker</span>
          <p className="text-sm font-mono text-[var(--text-secondary)] truncate">
            {task.worker ?? "—"}
          </p>
        </div>
        {task.paymentTx && (
          <div>
            <span className="text-xs text-[var(--text-secondary)]">Payment Tx</span>
            <a
              href={`https://testnet.monadscan.com/tx/${task.paymentTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-purple-400 hover:text-purple-300 truncate block"
            >
              {task.paymentTx.slice(0, 20)}...
            </a>
          </div>
        )}
      </div>

      {/* Status Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          {Object.values(TaskStatus).map((st) => {
            const isActive = task.status === st;
            const isPast = Object.values(TaskStatus).indexOf(task.status) >= Object.values(TaskStatus).indexOf(st);
            return (
              <span
                key={st}
                className={`text-[10px] uppercase tracking-wider font-medium ${
                  isActive ? s.color : isPast ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]/40"
                }`}
              >
                {st}
              </span>
            );
          })}
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${((Object.values(TaskStatus).indexOf(task.status) + 1) / Object.values(TaskStatus).length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
