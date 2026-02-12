import { useState, useEffect, useRef } from "react";
import { getHealth, connectSSE } from "../api";

interface PlatformHealth {
  status: string;
  platform: string;
  contract: string;
  escrowBalance: string;
  chain: string;
  tasks: {
    total: number;
    open: number;
    accepted: number;
    submitted: number;
    done: number;
  };
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  txHash?: string;
}

export function Agent() {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uptime, setUptime] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [activities]);

  // Health polling
  useEffect(() => {
    const check = async () => {
      try {
        const h = await getHealth();
        setHealth(h);
      } catch {
        setHealth(null);
      }
    };
    check();
    const iv = setInterval(check, 5_000);
    return () => clearInterval(iv);
  }, []);

  // Uptime counter
  useEffect(() => {
    const iv = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // SSE for real-time activities
  useEffect(() => {
    return connectSSE((event, data) => {
      const activity: Activity = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: event,
        message: formatEvent(event, data),
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        txHash: data?.escrowTx || data?.acceptTx || data?.submitTx || data?.payoutTx,
      };
      setActivities((prev) => [...prev.slice(-20), activity]);
    });
  }, []);

  const online = health?.status === "ok";

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <section id="agent" className="py-20 px-6 border-t-2 border-[var(--c-white)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">PLATFORM</h2>
          <span className={online ? "status-online" : "status-offline"}>
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Stats */}
          <div className="brutal-card p-6 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-[var(--c-gray-light)] pb-3">
              <span className="text-dim">STATUS</span>
              <span className={online ? "text-success" : "text-error"}>
                {online ? "● CONNECTED" : "○ DISCONNECTED"}
              </span>
            </div>

            <StatRow label="UPTIME" value={formatUptime(uptime)} />
            <StatRow label="CHAIN" value={health?.chain || "—"} />
            <StatRow 
              label="ESCROW BALANCE" 
              value={health ? `${parseFloat(health.escrowBalance).toFixed(4)} MON` : "—"} 
              accent 
            />
            
            <div className="border-t border-[var(--c-gray-light)] pt-3 mt-3">
              <p className="text-xs text-dim mb-2">TASK STATS</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <StatBox label="OPEN" value={health?.tasks.open ?? 0} />
                <StatBox label="ACTIVE" value={health?.tasks.accepted ?? 0} />
                <StatBox label="PENDING" value={health?.tasks.submitted ?? 0} />
                <StatBox label="DONE" value={health?.tasks.done ?? 0} />
              </div>
            </div>

            {health && (
              <div className="border-t border-[var(--c-gray-light)] pt-3 mt-3 text-xs">
                <p className="text-dim mb-1">CONTRACT</p>
                <a
                  href={`https://monadscan.com/address/${health.contract}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline break-all"
                >
                  {health.contract}
                </a>
              </div>
            )}
          </div>

          {/* Right - Activity Log */}
          <div className="terminal-box">
            <div className="terminal-header">
              <div className="terminal-dot bg-[var(--c-error)]" />
              <div className="terminal-dot bg-[var(--c-accent)]" />
              <div className="terminal-dot bg-[var(--c-success)]" />
              <span className="text-xs text-dim ml-2">activity.log</span>
              <span className="text-xs text-dim ml-auto">{activities.length} events</span>
            </div>

            <div ref={logRef} className="h-80 overflow-y-auto p-4 space-y-1 text-xs">
              {activities.length === 0 ? (
                <p className="text-dim">$ waiting for events<span className="cursor" /></p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="flex gap-2">
                    <span className="text-dim shrink-0">[{a.timestamp}]</span>
                    <span className={
                      a.type.includes("created") ? "text-accent" :
                      a.type.includes("updated") ? "text-success" :
                      "text-[var(--c-white)]"
                    }>
                      {a.message}
                    </span>
                    {a.txHash && (
                      <a
                        href={`https://monadscan.com/tx/${a.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dim hover:text-accent shrink-0"
                      >
                        [TX]
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-dim">{label}</span>
      <span className={accent ? "text-accent font-bold" : ""}>{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="brutal-card p-2">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-dim">{label}</p>
    </div>
  );
}

function formatEvent(event: string, data: any): string {
  if (event === "task:created") {
    return `NEW: "${data.title}" (${data.reward} MON)`;
  }
  if (event === "task:updated") {
    return `UPDATE: ${data.id} → ${data.status}`;
  }
  return `${event}: ${JSON.stringify(data).slice(0, 50)}`;
}
