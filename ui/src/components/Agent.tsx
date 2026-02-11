import { useState, useEffect, useRef } from "react";

const AGENT_API = "http://localhost:3002";

interface AgentStats {
  tasksMonitored: number;
  tasksVerified: number;
  resultsValidated: number;
  payoutsConfirmed: number;
  totalValueProcessed: number;
  uptimeSeconds: number;
}

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  txHash?: string;
}

export function Agent() {
  const [online, setOnline] = useState(false);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [address, setAddress] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [activities]);

  // Fetch agent
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(AGENT_API);
        if (res.ok) {
          const data = await res.json();
          setOnline(true);
          setStats(data.stats);
          setAddress(data.address);
        } else {
          setOnline(false);
        }
      } catch {
        setOnline(false);
      }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  // Fetch activities
  useEffect(() => {
    fetch(`${AGENT_API}/activity`)
      .then((r) => r.json())
      .then(setActivities)
      .catch(() => {});
  }, []);

  // SSE
  useEffect(() => {
    const es = new EventSource(`${AGENT_API}/events`);
    
    es.addEventListener("activity", (e) => {
      const act = JSON.parse(e.data);
      setActivities((prev) => [act, ...prev.slice(0, 19)]);
    });
    
    es.addEventListener("stats", (e) => {
      setStats(JSON.parse(e.data));
    });
    
    es.onerror = () => setOnline(false);
    return () => es.close();
  }, []);

  const formatUptime = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  return (
    <section id="agent" className="py-20 px-6 border-t-2 border-[var(--c-white)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">TASKFLOW AGENT</h2>
            <p className="text-dim text-sm">
              Autonomous monitor • On-chain verifier • Result validator
            </p>
          </div>
          <div className={online ? "status-online" : "status-offline"}>
            {online ? "ONLINE" : "OFFLINE"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Info */}
          <div className="space-y-6">
            {/* Address */}
            <div className="brutal-card p-6">
              <p className="text-xs text-dim mb-2">AGENT ADDRESS</p>
              {online ? (
                <p className="text-xs font-mono text-accent break-all">
                  {address}
                </p>
              ) : (
                <p className="text-xs text-dim">—</p>
              )}
            </div>

            {/* Stats */}
            <div className="brutal-card p-6">
              <p className="text-xs text-dim mb-4">STATISTICS</p>
              <div className="space-y-3">
                <StatRow label="UPTIME" value={stats ? formatUptime(stats.uptimeSeconds) : "—"} />
                <StatRow label="MONITORED" value={stats?.tasksMonitored ?? "—"} />
                <StatRow label="VERIFIED" value={stats?.tasksVerified ?? "—"} accent />
                <StatRow label="VALIDATED" value={stats?.resultsValidated ?? "—"} />
                <StatRow label="MON PROCESSED" value={stats ? stats.totalValueProcessed.toFixed(4) : "—"} accent />
              </div>
            </div>

            {/* What it does */}
            <div className="brutal-card p-6">
              <p className="text-xs text-dim mb-4">CAPABILITIES</p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-accent">▸</span>
                  <span>Monitors new tasks in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">▸</span>
                  <span>Verifies escrow deposits on-chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">▸</span>
                  <span>Validates submitted results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">▸</span>
                  <span>Confirms payout transactions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right - Activity Feed (2 cols) */}
          <div className="lg:col-span-2">
            <div className="terminal-box h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-[var(--c-error)]" />
                <div className="terminal-dot bg-[var(--c-accent)]" />
                <div className="terminal-dot bg-[var(--c-success)]" />
                <span className="text-xs text-dim ml-2">agent.log</span>
              </div>
              
              <div ref={logRef} className="h-[500px] overflow-y-auto p-4 space-y-1">
                {!online ? (
                  <p className="text-dim">
                    $ agent offline<span className="cursor" />
                  </p>
                ) : activities.length === 0 ? (
                  <p className="text-dim">
                    $ waiting for activity<span className="cursor" />
                  </p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-2 text-xs">
                      <span className="text-dim shrink-0">
                        [{act.timestamp.slice(11, 19)}]
                      </span>
                      <span className={
                        act.type === "payout_confirmed" ? "text-success" :
                        act.type === "task_verified" ? "text-accent" :
                        "text-[var(--c-white)]"
                      }>
                        {act.message.replace(/[^\x00-\x7F]/g, "")}
                      </span>
                      {act.txHash && (
                        <a
                          href={`https://monadscan.com/tx/${act.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline shrink-0"
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
      </div>
    </section>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-dim">{label}</span>
      <span className={accent ? "text-accent font-bold" : "text-[var(--c-white)]"}>
        {value}
      </span>
    </div>
  );
}
