import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskStatus } from "../types";

interface DemoEvent {
  id: number;
  time: string;
  agent: "REQ" | "WRK";
  detail: string;
  type: "cmd" | "ok" | "pay" | "sys";
}

interface DemoState {
  step: number;
  taskStatus: TaskStatus | null;
  events: DemoEvent[];
  reqBal: string;
  wrkBal: string;
  isRunning: boolean;
  isDone: boolean;
}

const INIT: DemoState = {
  step: 0,
  taskStatus: null,
  events: [],
  reqBal: "4.820",
  wrkBal: "1.250",
  isRunning: false,
  isDone: false,
};

const REQ_ADDR = "0x742d...f2bD18";
const WRK_ADDR = "0x8Ba1...DBA72";
const TX_HASH = "0x3a1b2c3d4e5f...8c9d0e1f2a3b";

const STATUS_CHARS: Record<string, { char: string; color: string }> = {
  [TaskStatus.Open]: { char: "◇", color: "text-[var(--mon-yellow)]" },
  [TaskStatus.Accepted]: { char: "◈", color: "text-[var(--mon-purple-glow)]" },
  [TaskStatus.Completed]: { char: "◆", color: "text-[var(--mon-cyan)]" },
  [TaskStatus.Confirmed]: { char: "●", color: "text-[var(--mon-yellow)]" },
  [TaskStatus.Paid]: { char: "✦", color: "text-[var(--mon-green)]" },
};

const PIPELINE = [
  TaskStatus.Open,
  TaskStatus.Accepted,
  TaskStatus.Completed,
  TaskStatus.Confirmed,
  TaskStatus.Paid,
];

export function LiveDemo() {
  const [s, setS] = useState<DemoState>(INIT);
  const logRef = useRef<HTMLDivElement>(null);
  const eid = useRef(0);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [s.events.length]);

  const log = useCallback(
    (agent: DemoEvent["agent"], detail: string, type: DemoEvent["type"]) => {
      const time = new Date().toISOString().slice(11, 19);
      setS((p) => ({ ...p, events: [...p.events, { id: ++eid.current, time, agent, detail, type }] }));
    },
    []
  );

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const run = useCallback(async () => {
    setS((p) => ({ ...p, isRunning: true, step: 1 }));

    log("REQ", '$ requester.execute("create_task", "Smart contract audit", "0.01")', "cmd");
    await wait(900);
    setS((p) => ({ ...p, taskStatus: TaskStatus.Open }));
    log("REQ", "→ task:created  id=a1b2c3d4  reward=0.01 MON  status=OPEN", "ok");
    log("REQ", "  EventEmitter.emit('task:created', { taskId: 'a1b2c3d4' })", "sys");
    await wait(700);

    setS((p) => ({ ...p, step: 2 }));
    log("WRK", '$ worker.execute("accept_task", "a1b2c3d4")', "cmd");
    await wait(800);
    setS((p) => ({ ...p, taskStatus: TaskStatus.Accepted }));
    log("WRK", `→ task:accepted  worker=${WRK_ADDR}  status=ACCEPTED`, "ok");
    await wait(700);

    setS((p) => ({ ...p, step: 3 }));
    log("WRK", '$ worker.execute("complete_task", "a1b2c3d4")', "cmd");
    await wait(800);
    setS((p) => ({ ...p, taskStatus: TaskStatus.Completed }));
    log("WRK", "→ task:completed  status=COMPLETED", "ok");
    log("WRK", "  EventEmitter.emit('task:completed', { taskId: 'a1b2c3d4' })", "sys");
    await wait(700);

    setS((p) => ({ ...p, step: 4 }));
    log("REQ", '$ requester.execute("confirm_completion", "a1b2c3d4")', "cmd");
    await wait(600);
    setS((p) => ({ ...p, taskStatus: TaskStatus.Confirmed }));
    log("REQ", "→ task:confirmed  status=CONFIRMED", "ok");
    await wait(400);

    setS((p) => ({ ...p, step: 5 }));
    log("REQ", `  sendMON(0.01, ${WRK_ADDR})  chain=monad-testnet  gas=21000`, "pay");
    await wait(1400);
    setS((p) => ({
      ...p,
      taskStatus: TaskStatus.Paid,
      reqBal: "4.810",
      wrkBal: "1.260",
    }));
    log("REQ", `→ tx confirmed  hash=${TX_HASH}`, "pay");
    log("REQ", "→ task:paid  status=PAID  ✦ settlement complete", "ok");
    await wait(300);

    setS((p) => ({ ...p, isRunning: false, isDone: true }));
  }, [log]);

  const reset = () => {
    eid.current = 0;
    setS(INIT);
  };

  const progress = s.taskStatus
    ? ((PIPELINE.indexOf(s.taskStatus) + 1) / PIPELINE.length) * 100
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
          <p className="font-pixel text-[10px] text-[var(--mon-cyan)] mb-3">// SIMULATION</p>
          <h2 className="font-pixel text-lg md:text-xl text-[var(--mon-text)] mb-2">
            LIVE DEMO
          </h2>
          <p className="text-sm text-[var(--mon-text-dim)]">
            Watch the full agent→agent→payment flow in real time.
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
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--mon-red)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--mon-yellow)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--mon-green)]" />
              <span className="ml-3 text-[10px] text-[var(--mon-text-dim)]">
                taskflow — run-demo.ts
              </span>
            </div>
            {!s.isRunning && !s.isDone && (
              <button
                onClick={run}
                className="font-pixel text-[8px] bg-[var(--mon-purple)] hover:bg-[var(--mon-purple-glow)] text-white px-4 py-1.5 rounded transition-all cursor-pointer tracking-wider"
              >
                ▶ RUN
              </button>
            )}
            {s.isRunning && (
              <span className="font-pixel text-[8px] text-[var(--mon-purple-glow)] animate-pulse">
                ◌ EXECUTING...
              </span>
            )}
            {s.isDone && (
              <button
                onClick={reset}
                className="font-pixel text-[8px] text-[var(--mon-text-dim)] hover:text-white border border-[var(--mon-border)] px-4 py-1.5 rounded transition-all cursor-pointer tracking-wider"
              >
                ↺ RESET
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* ── Left panel: Status ── */}
            <div className="lg:col-span-4 p-4 border-r border-[var(--mon-border)] bg-[var(--mon-surface)]">
              {/* Agents */}
              <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                ┌ AGENTS
              </p>
              <div className="space-y-2 mb-5">
                <AgentRow
                  label="REQUESTER"
                  sym="▓▓"
                  addr={REQ_ADDR}
                  bal={s.reqBal}
                  color="var(--mon-purple-glow)"
                  active={s.isRunning && [1, 4, 5].includes(s.step)}
                />
                <AgentRow
                  label="WORKER"
                  sym="░░"
                  addr={WRK_ADDR}
                  bal={s.wrkBal}
                  color="var(--mon-cyan)"
                  active={s.isRunning && [2, 3].includes(s.step)}
                />
              </div>

              {/* Task */}
              <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                ┌ TASK
              </p>
              <div className="bg-[var(--mon-darker)] rounded p-3 mb-5">
                {s.taskStatus ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[var(--mon-text)]">Smart contract audit</span>
                      <span className={`font-pixel text-[8px] ${STATUS_CHARS[s.taskStatus].color}`}>
                        {STATUS_CHARS[s.taskStatus].char} {s.taskStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--mon-text-dim)] mb-3">
                      <span>id: a1b2c3d4</span>
                      <span className="text-[var(--mon-green)]">0.01 MON</span>
                    </div>
                    {/* ASCII progress */}
                    <div className="font-pixel text-[8px]">
                      <div className="flex items-center gap-1 text-[var(--mon-text-dim)]">
                        <span>[</span>
                        {PIPELINE.map((st, i) => {
                          const reached = PIPELINE.indexOf(s.taskStatus!) >= i;
                          return (
                            <span key={st} className={reached ? STATUS_CHARS[st].color : "text-[var(--mon-border)]"}>
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

              {/* Steps */}
              <p className="text-[10px] text-[var(--mon-text-dim)] uppercase tracking-widest mb-3">
                ┌ PIPELINE
              </p>
              <div className="space-y-1">
                {[
                  { n: 1, label: "create_task", agent: "REQ" },
                  { n: 2, label: "accept_task", agent: "WRK" },
                  { n: 3, label: "complete_task", agent: "WRK" },
                  { n: 4, label: "confirm_completion", agent: "REQ" },
                  { n: 5, label: "send_payment", agent: "REQ" },
                ].map((step) => {
                  const done = s.step > step.n || (s.isDone && s.step >= step.n);
                  const active = s.step === step.n && s.isRunning;
                  return (
                    <div key={step.n} className="flex items-center gap-2 text-[11px]">
                      <span className={`w-4 text-center ${done ? "text-[var(--mon-green)]" : active ? "text-[var(--mon-purple-glow)] animate-pulse" : "text-[var(--mon-border)]"}`}>
                        {done ? "✓" : active ? "▸" : "·"}
                      </span>
                      <span className={`font-mono ${done ? "text-[var(--mon-text-dim)]" : active ? "text-[var(--mon-text)]" : "text-[var(--mon-border)]"}`}>
                        {step.label}
                      </span>
                      <span className={`ml-auto text-[9px] ${step.agent === "REQ" ? "text-[var(--mon-purple-dim)]" : "text-[var(--mon-cyan)]/50"}`}>
                        {step.agent}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right panel: Terminal log ── */}
            <div className="lg:col-span-8 bg-[var(--mon-darker)] p-4">
              <div ref={logRef} className="space-y-0.5 max-h-[420px] overflow-y-auto pr-2 text-[11px] leading-relaxed">
                <p className="text-[var(--mon-text-dim)]">
                  <span className="text-[var(--mon-purple-dim)]">~</span> npx tsx scripts/run-demo.ts
                </p>
                <p className="text-[var(--mon-text-dim)] mb-2">
                  ─ taskflow v0.1.0 ─ monad-testnet ─ chain:10143 ─
                </p>

                {s.events.length === 0 && !s.isRunning && (
                  <p className="text-[var(--mon-border)] cursor-blink mt-2">
                    waiting for input
                  </p>
                )}

                <AnimatePresence>
                  {s.events.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="text-[var(--mon-border)]">[{ev.time}]</span>{" "}
                      <span className={ev.agent === "REQ" ? "text-[var(--mon-purple-glow)]" : "text-[var(--mon-cyan)]"}>
                        {ev.agent}
                      </span>{" "}
                      {ev.type === "cmd" ? (
                        <span className="text-[var(--mon-text-dim)]">{ev.detail}</span>
                      ) : ev.type === "pay" ? (
                        <span className="text-[var(--mon-yellow)]">{ev.detail}</span>
                      ) : ev.type === "sys" ? (
                        <span className="text-[var(--mon-border)]">{ev.detail}</span>
                      ) : (
                        <span className="text-[var(--mon-green)]">{ev.detail}</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {s.isDone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 pt-3 border-t border-[var(--mon-border)]/30"
                  >
                    <p className="text-[var(--mon-green)]">
                      ═══ SETTLEMENT COMPLETE ═══
                    </p>
                    <p className="text-[var(--mon-text-dim)] mt-1">
                      explorer: <span className="text-[var(--mon-purple-glow)]">testnet.monadscan.com/tx/{TX_HASH.slice(0, 12)}...</span>
                    </p>
                    <p className="text-[var(--mon-text-dim)]">
                      finality: ~800ms │ gas: 21,000 │ cost: ~0.0001 MON
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AgentRow({
  label,
  sym,
  addr,
  bal,
  color,
  active,
}: {
  label: string;
  sym: string;
  addr: string;
  bal: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      className={`bg-[var(--mon-darker)] rounded px-3 py-2 border transition-all ${
        active ? "border-[var(--mon-purple-dim)] glow-border" : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="text-xs">{sym}</span>
          <span className="font-pixel text-[8px]" style={{ color }}>{label}</span>
          {active && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          )}
        </div>
        <span className="text-[11px] text-[var(--mon-green)]">{bal} <span className="text-[var(--mon-text-dim)]">MON</span></span>
      </div>
      <p className="text-[9px] text-[var(--mon-text-dim)] mt-0.5">{addr}</p>
    </div>
  );
}
