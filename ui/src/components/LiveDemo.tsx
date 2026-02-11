import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHealth, getTasks, createTask, acceptTask, submitTask, connectSSE, CONTRACT_ADDRESS } from "../api";
import { TaskStatus, type Task } from "../types";

// ─── Status helpers ──────────────────────────────────────────────────
function statusColor(s: string) {
  if (s === TaskStatus.Open) return "text-[var(--mon-yellow)]";
  if (s === TaskStatus.Accepted) return "text-[var(--mon-purple-glow)]";
  if (s === TaskStatus.Submitted) return "text-[var(--mon-cyan)]";
  if (s === TaskStatus.Done) return "text-[var(--mon-green)]";
  return "text-[var(--mon-text-dim)]";
}

function statusIcon(s: string) {
  if (s === TaskStatus.Open) return "📋";
  if (s === TaskStatus.Accepted) return "🤝";
  if (s === TaskStatus.Submitted) return "📦";
  if (s === TaskStatus.Done) return "✅";
  return "•";
}

// ─── Demo config ─────────────────────────────────────────────────────
const DEMO_REQUESTER = "0xReq_" + Math.random().toString(36).slice(2, 8);
const DEMO_WORKER = "0xWork_" + Math.random().toString(36).slice(2, 8);

const TASKS = [
  { title: "Analyze Token Contract", description: "Review ERC-20 contract for issues", reward: "0.005" },
  { title: "Fetch DEX Prices", description: "Get top 5 token prices on Monad", reward: "0.002" },
  { title: "Monitor Wallet", description: "Track recent wallet activity", reward: "0.003" },
];

export function LiveDemo() {
  const [health, setHealth] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const log = useCallback((msg: string) => {
    setLogs((p) => [...p.slice(-40), msg]);
  }, []);

  // Health check
  useEffect(() => {
    const check = async () => {
      try { setHealth(await getHealth()); } catch { setHealth(null); }
    };
    check();
    const iv = setInterval(check, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Load tasks
  useEffect(() => { getTasks().then(setTasks).catch(() => {}); }, []);

  // SSE
  useEffect(() => {
    return connectSSE((event, data) => {
      if (event === "connected") log("📡 Connected to platform");
      else if (event === "task:created") {
        setTasks((p) => p.find((t) => t.id === data.id) ? p : [data, ...p]);
        log(`📋 Task created: "${data.title}"`);
      } else if (event === "task:updated") {
        setTasks((p) => p.map((t) => (t.id === data.id ? data : t)));
        log(`${statusIcon(data.status)} Task → ${data.status}`);
      }
    });
  }, [log]);

  // Run full flow — ALL ON-CHAIN
  const runDemo = async () => {
    if (running || !health) return;
    setRunning(true);
    const tpl = TASKS[Math.floor(Math.random() * TASKS.length)];

    try {
      log("💸 Creating task (on-chain escrow)...");
      const task = await createTask({
        title: tpl.title, 
        description: tpl.description,
        reward: tpl.reward, 
        requester: DEMO_REQUESTER,
      });
      log(`✅ Escrow tx: ${task.escrowTx?.slice(0, 18)}...`);
      log(`🔗 monadscan.com/tx/${task.escrowTx?.slice(0, 12)}...`);

      await delay(1500);
      log("🤝 Accepting task (on-chain)...");
      const accepted = await acceptTask(task.id, DEMO_WORKER);
      log(`✅ Accept tx: ${accepted.acceptTx?.slice(0, 18)}...`);

      await delay(1500);
      log("⚙️ Worker processing task...");
      await delay(2000);

      log("📦 Submitting result (on-chain)...");
      const submitted = await submitTask(task.id, DEMO_WORKER, JSON.stringify({ 
        status: "completed", 
        task: tpl.title,
        result: "Task completed successfully via on-chain verification" 
      }));
      log(`✅ Submit tx: ${submitted.submitTx?.slice(0, 18)}...`);

      log("💸 Platform releasing payout...");
      await delay(3000);
      
      // Refresh to get payout tx
      const updated = await getTasks();
      const final = updated.find(t => t.id === task.id);
      if (final?.payoutTx) {
        log(`✅ Payout tx: ${final.payoutTx.slice(0, 18)}...`);
        log(`🎉 ${tpl.reward} MON sent to worker!`);
      }
      
      log("═══════════════════════════════════");
      log("🔗 All txs verified on Monadscan!");
    } catch (err: any) {
      log(`❌ ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const online = !!health;

  return (
    <section id="live-demo" className="py-20 border-t border-[var(--mon-border)]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="font-pixel text-sm text-[var(--mon-text)] mb-2">LIVE DEMO</h2>
          <p className="text-[11px] text-[var(--mon-text-dim)]">
            Run the full marketplace flow — create, accept, submit, pay.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Controls + Logs */}
          <div className="space-y-4">
            {/* Status */}
            <div className="retro-box rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${online ? "bg-[var(--mon-green)] animate-pulse" : "bg-[var(--mon-red)]"}`} />
                <span className="text-[10px] text-[var(--mon-text-dim)]">
                  {online ? "PLATFORM ONLINE" : "PLATFORM OFFLINE — run npm run agent"}
                </span>
              </div>
              {online && (
                <div className="flex gap-4 text-[10px]">
                  <span className="text-[var(--mon-text-dim)]">Balance: <span className="text-[var(--mon-green)]">{parseFloat(health.escrowBalance).toFixed(4)} MON</span></span>
                  <span className="text-[var(--mon-text-dim)]">Tasks: <span className="text-[var(--mon-yellow)]">{health.tasks?.open ?? 0}</span>/<span className="text-[var(--mon-purple-glow)]">{health.tasks?.accepted ?? 0}</span>/<span className="text-[var(--mon-green)]">{health.tasks?.done ?? 0}</span></span>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={runDemo}
              disabled={running || !online}
              className={`w-full font-pixel text-[10px] py-3 rounded transition-all cursor-pointer ${
                running || !online
                  ? "bg-[var(--mon-surface-2)] text-[var(--mon-text-dim)] cursor-not-allowed"
                  : "bg-[var(--mon-purple)] hover:bg-[var(--mon-purple-glow)] text-white glow-border"
              }`}
            >
              {running ? "⏳ RUNNING..." : "▶ RUN FULL FLOW"}
            </button>

            {/* Logs */}
            <div className="retro-box rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--mon-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mon-red)]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mon-yellow)]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mon-green)]" />
                <span className="text-[9px] text-[var(--mon-text-dim)] ml-2">events</span>
              </div>
              <div ref={logRef} className="h-52 overflow-y-auto p-3 text-[10px] font-mono space-y-0.5">
                {logs.length === 0 ? (
                  <p className="text-[var(--mon-text-dim)]">$ waiting...<span className="cursor-blink" /></p>
                ) : (
                  logs.map((l, i) => (
                    <p key={i} className={
                      l.includes("❌") ? "text-[var(--mon-red)]" :
                      l.includes("✅") ? "text-[var(--mon-green)]" :
                      "text-[var(--mon-text-dim)]"
                    }>{l}</p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Task Board */}
          <div className="retro-box rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--mon-border)]">
              <span className="font-pixel text-[8px] text-[var(--mon-text)]">TASK BOARD</span>
            </div>
            <div className="h-[400px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-[11px] text-[var(--mon-text-dim)]">No tasks yet — run the demo</p>
                </div>
              ) : (
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border-b border-[var(--mon-border)] last:border-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[var(--mon-text)] flex items-center gap-2">
                          {statusIcon(task.status)} {task.title}
                        </span>
                        <span className={`text-[9px] font-pixel ${statusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[9px] text-[var(--mon-text-dim)]">
                        <span className="text-[var(--mon-yellow)]">{task.reward} MON</span>
                        {task.escrowTx && (
                          <a href={`https://monadscan.com/tx/${task.escrowTx}`} target="_blank" rel="noopener noreferrer" className="text-[var(--mon-cyan)] hover:underline">escrow↗</a>
                        )}
                        {task.acceptTx && (
                          <a href={`https://monadscan.com/tx/${task.acceptTx}`} target="_blank" rel="noopener noreferrer" className="text-[var(--mon-purple-glow)] hover:underline">accept↗</a>
                        )}
                        {task.submitTx && (
                          <a href={`https://monadscan.com/tx/${task.submitTx}`} target="_blank" rel="noopener noreferrer" className="text-[var(--mon-cyan)] hover:underline">submit↗</a>
                        )}
                        {task.payoutTx && (
                          <a href={`https://monadscan.com/tx/${task.payoutTx}`} target="_blank" rel="noopener noreferrer" className="text-[var(--mon-green)] hover:underline">payout↗</a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
