import { useEffect, useRef } from "react";
import type { EventLog } from "../types";

const typeStyles = {
  info: "border-l-blue-500/50",
  success: "border-l-green-500/50",
  warning: "border-l-yellow-500/50",
  payment: "border-l-purple-500/50",
};

const typeIcons = {
  info: "📋",
  success: "✅",
  warning: "⏳",
  payment: "💸",
};

interface Props {
  events: EventLog[];
}

export function EventLogPanel({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="text-lg font-semibold mb-4">📡 Event Log</h2>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">
            Waiting for events...
          </p>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className={`border-l-2 ${typeStyles[ev.type]} bg-white/[0.02] rounded-r-lg p-3 animate-slide-in`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{typeIcons[ev.type]}</span>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                  {ev.timestamp}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium ${
                    ev.agent === "RequesterAgent" ? "text-purple-400" : "text-blue-400"
                  }`}
                >
                  {ev.agent}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                  {ev.event}
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)]/80 font-mono leading-relaxed">
                {ev.detail}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
