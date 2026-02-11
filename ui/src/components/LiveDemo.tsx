import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "../api";

// ─── Types ──────────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  time: string;
  text: string;
  type: "cmd" | "ok" | "pay" | "sys" | "err";
}

const STATUS_LABELS = ["OPEN", "ACCEPTED", "COMPLETED", "CONFIRMED", "PAID"] as const;

const STATUS_STYLE: Record<string, { char: string; color: string }> = {
  OPEN: { char: "◇", color: "text-[var(--mon-yellow)]" },
  ACCEPTED: { char: "◈", color: "text-[var(--mon-purple-glow)]" },
  COMPLETED: { char: "◆", color: "text-[var(--mon-cyan)]" },
  CONFIRMED: { char: "●", color: "text-[var(--mon-yellow)]" },
  PAID: { char: "✦", color: "text-[var(--mon-green)]" },
};

// ─── Component ──────────────────────────────────────────────────────

export function LiveDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<api.HealthResponse | null>(null);
  const [online, setOnline] = useState(false);
  const [step, setStep] = useState(0);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const eid = useRef(0);

  // Auto-scroll terminal
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logs.length]);

  const log = useCallback((text: string, type: LogEntry["type"] = "sys") => {
    const time = new Date().toISOString().slice(11, 19);
    setLogs((p) => [...p, { id: ++eid.current, time, text, type }]);
  }, []);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Health polling — check if agent is running
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const h = await api.getHealth();
        if (!cancelled) {
          setHealth(h);
          setOnline(true);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setOnline(false);
        }
      }
    };
    check();
    const iv = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Run full lifecycle against real agent
  const run = useCallback(async () => {
    if (!health || !online || isRunning) return;
    setIsRunning(true);
    setIsDone(false);
    setLogs([]);
    setStep(0);
    setTaskStatus(null);
    setTaskId(null);
    setTxHash(null);
    eid.current = 0;

    const addr = health.wallet;
    const short = addr.length > 10 ? addr.slice(0, 6) + "..." + addr.slice(-4) : addr;

    try {
      // STEP 1: Create task
      setStep(1);
      log(`$ POST /tasks`, "cmd");
      log(`  { title: "Audit smart contract", reward: "0.001", requester: "${short}" }`, "cmd");
      await wait(400);
      const task = await api.createTask("Audit smart contract", "0.001", addr);
      setTaskId(task.id);
      setTaskStatus("OPEN");
      log(`→ task:created  id=${task.id}  reward=0.001 MON  status=OPEN`, "ok");
      await wait(1000);

      // STEP 2: Accept task
      setStep(2);
      log(`$ POST /tasks/${task.id}/accept`, "cmd");
      log(`  { worker: "${short}" }`, "cmd");
      await wait(400);
      await api.acceptTask(task.id, addr);
      setTaskStatus("ACCEPTED");
      log(`→ task:accepted  worker=${short}  status=ACCEPTED`, "ok");
      await wait(1000);

      // STEP 3: Complete task
      setStep(3);
      log(`$ POST /tasks/${task.id}/complete`, "cmd");
      log(`  { worker: "${short}" }`, "cmd");
      await wait(400);
      await api.completeTask(task.id, addr);
      setTaskStatus("COMPLETED");
      log(`→ task:completed  status=COMPLETED`, "ok");
      await wait(1000);

      // STEP 4: Confirm → triggers MON payment
      setStep(4);
      log(`$ POST /tasks/${task.id}/confirm`, "cmd");
      log(`  { requester: "${short}" }`, "cmd");
      await wait(400);
      log(`  ⏳ sendMON(0.001 MON → ${short})  chain=143`, "pay");
      const result = await api.confirmTask(task.id, addr);

      if (result.paymentTx) {
        setStep(5);
        setTaskStatus("PAID");
        setTxHash(result.paymentTx);
        const shortTx = result.paymentTx.slice(0, 16) + "..." + result.paymentTx.slice(-6);
        log(`→ tx confirmed  hash=${shortTx}`, "pay");
        log(`→ task:paid  status=PAID  ✦ settlement complete`, "ok");
      } else {
        setStep(5);
        setTaskStatus("CONFIRMED");
        log(`→ task:confirmed  status=CONFIRMED`, "ok");
        log(`  (PRIVATE_KEY not set — payment skipped)`, "sys");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`✗ Error: ${msg}`, "err");
    }

    setIsDone(true);
    setIsRunning(false);
  }, [health, online, isRunning, log]);

  const reset = () => {
    eid.current = 0;
    setLogs([]);
    setStep(0);
    setTaskStatus(null);
    setTaskId(null);
    setTxHash(null);
    setIsRunning(false);
    setIsDone(false);
  };

  const progress = taskStatus
    ? ((STATUS_LABELS.indexOf(taskStatus as (typeof STATUS_LABELS)[number]) + 1) / STATUS_LABELS.length) * 100
    : 0;

  return (
    <section id="live-demo" className="py-28 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-pixel text-[10px] text-[var(--mon-cyan)] mb-3">// LIVE</p>
          <h2 className="font-pixel text-lg md:text-xl text-[var(--mon-text)] mb-2">
            LIVE DEMO
          </h2>
          <p className="text-sm text-[var(--mon-text-dim)]">
            Real agent. Real API calls. Real MON on Monad.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="retro-box rounded-lg overflow-hidden"
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--mon-surface-2)] border-b border-[var(--mon-border)]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-[var(--mon-green)]" : "bg-[var(--mon-red)]"}`} />
              <span className="ml-2 text-[10px] text-[var(--mon-text-dim)]">
                {online ? `taskflow-agent — ${health?.wallet?.slice(0, 10)}...` : "agent offline"}
              </span>
            </div>
            {online && !isRunning && !isDone && (
              <button
                onClick={run}
                className="font-pixel text-[8px] bg-[var(--mon-purple)] hover:bg-[var(--mon-purple-glow)] text-white px-4 py-1.5 rounded transition-all cursor-pointer tracking-wider"
              >
                ▶ RUN
              </button>
            )}
            {isRunning && (
              <span className="font-pixel text-[8px] text-[var(--mon-purple-glow)] animate-pulse">
                ◌ EXECUTING...
              </span>
            )}
            {isDone && (
              <button
                onClick={reset}
                className="font-pixel text-[8px] text-[var(--mon-text-dim)] hover:text-white border border-[var(--mon-border)] px-4 py-1.5 rounded transition-all cursor-pointer tracking-wider"
              >
                ↺ RESET
              </button>
            )}
          </div>

          {!online ? (
            /* ── Offline state ── */
            <div className="p-12 text-center">
              <p className="font-pixel text-[10px] text-[var(--mon-red)] mb-3">AGENT OFFLINE</p>
              <p className="text-sm text-[var(--mon-text-dim)] mb-4">
                Start the TaskFlow agent to run the live demo.
              </p>
              <div className="inline-block bg-[var(--mon-darker)] rounded px-4 py-2">
                <code className="text-[12px] text-[var(--mon-purple-glow)]">$ npm run agent</code>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* ── Left panel: Status ── */}
              <div className="lg:col-span-4 p-4 border-r border-[var(--mon-border)] bg-[var(--mon-surface)]">
                {/* Agent */}
                <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                  ┌ AGENT
                </p>
                <div className="bg-[var(--mon-darker)] rounded px-3 py-2 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--mon-purple-glow)] text-xs">⚡</span>
                      <span className="font-pixel text-[8px] text-[var(--mon-purple-glow)]">TASKFLOW</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--mon-green)] animate-pulse" />
                    </div>
                    <span className="text-[10px] text-[var(--mon-text-dim)]">v{health?.version}</span>
                  </div>
                  <p className="text-[9px] text-[var(--mon-text-dim)] mt-1 font-mono">
                    {health?.wallet && health.wallet.length > 20
                      ? health.wallet.slice(0, 20) + "..."
                      : health?.wallet}
                  </p>
                </div>

                {/* Task */}
                <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                  ┌ TASK
                </p>
                <div className="bg-[var(--mon-darker)] rounded p-3 mb-5">
                  {taskStatus ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-[var(--mon-text)]">Audit smart contract</span>
                        <span className={`font-pixel text-[8px] ${STATUS_STYLE[taskStatus]?.color ?? ""}`}>
                          {STATUS_STYLE[taskStatus]?.char} {taskStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--mon-text-dim)] mb-3">
                        <span>id: {taskId}</span>
                        <span className="text-[var(--mon-green)]">0.001 MON</span>
                      </div>
                      {/* Progress bar */}
                      <div className="font-pixel text-[8px]">
                        <div className="flex items-center gap-1 text-[var(--mon-text-dim)]">
                          <span>[</span>
                          {STATUS_LABELS.map((st, i) => {
                            const reached = STATUS_LABELS.indexOf(taskStatus as (typeof STATUS_LABELS)[number]) >= i;
                            return (
                              <span key={st} className={reached ? (STATUS_STYLE[st]?.color ?? "") : "text-[var(--mon-border)]"}>
                                {reached ? "█" : "░"}
                              </span>
                            );
                          })}
                          <span>]</span>
                          <span className="ml-1">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-[var(--mon-text-dim)] text-center py-3 cursor-blink">
                      awaiting execution
                    </p>
                  )}
                </div>

                {/* Pipeline */}
                <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                  ┌ PIPELINE
                </p>
                <div className="space-y-1">
                  {[
                    { n: 1, label: "POST /tasks", tag: "CREATE" },
                    { n: 2, label: "POST /accept", tag: "ACCEPT" },
                    { n: 3, label: "POST /complete", tag: "DONE" },
                    { n: 4, label: "POST /confirm", tag: "CONFIRM" },
                    { n: 5, label: "sendMON()", tag: "PAY" },
                  ].map((s) => {
                    const done = step > s.n || (isDone && step >= s.n);
                    const active = step === s.n && isRunning;
                    return (
                      <div key={s.n} className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`w-4 text-center ${
                            done
                              ? "text-[var(--mon-green)]"
                              : active
                                ? "text-[var(--mon-purple-glow)] animate-pulse"
                                : "text-[var(--mon-border)]"
                          }`}
                        >
                          {done ? "✓" : active ? "▸" : "·"}
                        </span>
                        <span
                          className={`font-mono ${
                            done
                              ? "text-[var(--mon-text-dim)]"
                              : active
                                ? "text-[var(--mon-text)]"
                                : "text-[var(--mon-border)]"
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="ml-auto text-[9px] text-[var(--mon-text-dim)]">{s.tag}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Right panel: Terminal log ── */}
              <div className="lg:col-span-8 bg-[var(--mon-darker)] p-4">
                <div ref={logRef} className="space-y-0.5 max-h-[420px] overflow-y-auto pr-2 text-[11px] leading-relaxed">
                  <p className="text-[var(--mon-text-dim)]">
                    <span className="text-[var(--mon-purple-dim)]">~</span> connected to taskflow-agent @ localhost:3001
                  </p>
                  <p className="text-[var(--mon-text-dim)] mb-2">
                    ─ taskflow v{health?.version} ─ monad-mainnet ─ chain:143 ─
                  </p>

                  {logs.length === 0 && !isRunning && (
                    <p className="text-[var(--mon-border)] cursor-blink mt-2">
                      press ▶ RUN to execute full lifecycle
                    </p>
                  )}

                  <AnimatePresence>
                    {logs.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className="text-[var(--mon-border)]">[{entry.time}]</span>{" "}
                        {entry.type === "cmd" ? (
                          <span className="text-[var(--mon-text-dim)]">{entry.text}</span>
                        ) : entry.type === "pay" ? (
                          <span className="text-[var(--mon-yellow)]">{entry.text}</span>
                        ) : entry.type === "err" ? (
                          <span className="text-[var(--mon-red)]">{entry.text}</span>
                        ) : entry.type === "ok" ? (
                          <span className="text-[var(--mon-green)]">{entry.text}</span>
                        ) : (
                          <span className="text-[var(--mon-border)]">{entry.text}</span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isDone && txHash && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3 pt-3 border-t border-[var(--mon-border)]/30"
                    >
                      <p className="text-[var(--mon-green)]">═══ SETTLEMENT COMPLETE ═══</p>
                      <p className="text-[var(--mon-text-dim)] mt-1">
                        explorer:{" "}
                        <a
                          href={`https://monadscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--mon-purple-glow)] hover:underline"
                        >
                          monadscan.com/tx/{txHash.slice(0, 12)}...
                        </a>
                      </p>
                    </motion.div>
                  )}

                  {isDone && !txHash && taskStatus && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3 pt-3 border-t border-[var(--mon-border)]/30"
                    >
                      <p className="text-[var(--mon-yellow)]">═══ LIFECYCLE COMPLETE ═══</p>
                      <p className="text-[var(--mon-text-dim)] mt-1">
                        Set PRIVATE_KEY in .env to enable on-chain MON transfers.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
