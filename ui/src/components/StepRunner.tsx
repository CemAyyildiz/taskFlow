import type { DemoStep } from "../types";

const agentColors = {
  requester: "border-purple-500/40 bg-purple-500/5",
  worker: "border-blue-500/40 bg-blue-500/5",
};

interface Props {
  steps: DemoStep[];
  currentStep: number;
  isRunning: boolean;
  isDone: boolean;
  onNext: () => void;
  onReset: () => void;
}

export function StepRunner({ steps, currentStep, isRunning, isDone, onNext, onReset }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">🔄 Demo Runner</h2>
        <div className="flex gap-2">
          {isDone ? (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
            >
              ↺ Reset
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={isRunning}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                isRunning
                  ? "bg-purple-500/20 text-purple-300 cursor-wait"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              }`}
            >
              {isRunning ? "⏳ Running..." : currentStep === 0 ? "▶ Start Demo" : "▶ Next Step"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-lg border p-4 transition-all duration-300 ${
              step.status === "running"
                ? `${agentColors[step.agent]} animate-pulse-glow`
                : step.status === "done"
                ? "border-green-500/30 bg-green-500/5"
                : "border-[var(--border)] bg-[var(--bg-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm">
                {step.status === "done" ? (
                  <span className="text-green-400">✓</span>
                ) : step.status === "running" ? (
                  <span className="animate-spin">⚙</span>
                ) : (
                  <span className="text-[var(--text-secondary)]">{step.id}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{step.label}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium ${
                      step.agent === "requester"
                        ? "text-purple-400 bg-purple-500/10"
                        : "text-blue-400 bg-blue-500/10"
                    }`}
                  >
                    {step.agent}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono truncate">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
