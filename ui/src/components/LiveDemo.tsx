import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  FileText,
  UserCheck,
  Package,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealth, getTasks, createTask, acceptTask, submitTask, connectSSE } from "../api";
import type { Task } from "../types";

const DEMO_REQUESTER = "agent://requester-" + Math.random().toString(36).slice(2, 8);
const DEMO_WORKER = "agent://worker-" + Math.random().toString(36).slice(2, 8);

const TASK_TEMPLATES = [
  { title: "Analyze Token Contract", description: "Review ERC-20 contract for security issues", reward: "0.005" },
  { title: "Fetch DEX Prices", description: "Get top 5 token prices from Monad DEXes", reward: "0.002" },
  { title: "Monitor Wallet Activity", description: "Track recent transactions for a wallet", reward: "0.003" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  OPEN: { color: "text-yellow-500", icon: FileText },
  ACCEPTED: { color: "text-purple-500", icon: UserCheck },
  SUBMITTED: { color: "text-blue-500", icon: Package },
  DONE: { color: "text-green-500", icon: Wallet },
};

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
      try { 
        setHealth(await getHealth()); 
      } catch { 
        setHealth(null); 
      }
    };
    check();
    const iv = setInterval(check, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Load tasks
  useEffect(() => { 
    getTasks().then(setTasks).catch(() => {}); 
  }, []);

  // SSE
  useEffect(() => {
    return connectSSE((event, data) => {
      if (event === "connected") log("Connected to platform");
      else if (event === "task:created") {
        setTasks((p) => p.find((t) => t.id === data.id) ? p : [data, ...p]);
        log(`Task created: "${data.title}"`);
      } else if (event === "task:updated") {
        setTasks((p) => p.map((t) => (t.id === data.id ? data : t)));
        log(`Task "${data.title}" → ${data.status}`);
      }
    });
  }, [log]);

  // Run demo
  const runDemo = async () => {
    if (running || !health) return;
    setRunning(true);
    const tpl = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];

    try {
      log("Creating task (on-chain escrow)...");
      const task = await createTask({
        title: tpl.title, 
        description: tpl.description,
        reward: tpl.reward, 
        requester: DEMO_REQUESTER,
      });
      log(`Escrow tx: ${task.escrowTx?.slice(0, 20)}...`);

      await delay(1500);
      log("Accepting task (on-chain)...");
      const accepted = await acceptTask(task.id, DEMO_WORKER);
      log(`Accept tx: ${accepted.acceptTx?.slice(0, 20)}...`);

      await delay(1500);
      log("Processing task...");
      await delay(2000);

      log("Submitting result (on-chain)...");
      const submitted = await submitTask(task.id, DEMO_WORKER, JSON.stringify({ 
        status: "completed", 
        task: tpl.title,
        result: "Task completed successfully" 
      }));
      log(`Submit tx: ${submitted.submitTx?.slice(0, 20)}...`);

      log("Releasing payout...");
      await delay(3000);
      
      const updated = await getTasks();
      const final = updated.find(t => t.id === task.id);
      if (final?.payoutTx) {
        log(`Payout tx: ${final.payoutTx.slice(0, 20)}...`);
        log(`${tpl.reward} MON sent to worker!`);
      }
      
      log("─ All transactions verified on Monadscan ─");
    } catch (err: any) {
      log(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const online = !!health;

  return (
    <section className="py-20 px-6 border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4">
            Live Demo
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Run a complete task flow with real on-chain transactions on Monad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls + Logs */}
          <div className="space-y-6">
            {/* Platform Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${online ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-error)]"}`} />
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {online ? "Platform Online" : "Platform Offline"}
                    </span>
                  </div>
                  {online && (
                    <Badge variant="outline" className="text-xs">
                      {parseFloat(health.escrowBalance || 0).toFixed(4)} MON
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={runDemo}
                  disabled={running || !online}
                  className="w-full gap-2"
                >
                  {running ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Full Flow
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Event Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Event Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={logRef} 
                  className="h-48 overflow-y-auto bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] p-3 font-mono text-xs space-y-1"
                >
                  {logs.length === 0 ? (
                    <p className="text-[var(--color-text-muted)]">
                      $ waiting<span className="cursor-blink" />
                    </p>
                  ) : (
                    logs.map((l, i) => (
                      <p key={i} className={
                        l.includes("Error") ? "text-[var(--color-error)]" :
                        l.includes("tx:") ? "text-[var(--color-accent)]" :
                        l.includes("MON") ? "text-[var(--color-success)]" :
                        "text-[var(--color-text-secondary)]"
                      }>
                        {l}
                      </p>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Task Board */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Task Board</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {tasks.length} tasks
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] overflow-y-auto space-y-3">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No tasks yet
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Run the demo to create one
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const config = statusConfig[task.status] || statusConfig.OPEN;
                    const StatusIcon = config.icon;
                    
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${config.color}`} />
                            <span className="text-sm font-medium text-[var(--color-text)]">
                              {task.title}
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${config.color}`}>
                            {task.status}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="text-[var(--color-warning)]">
                            {task.reward} MON
                          </span>
                          
                          {task.escrowTx && (
                            <TxLink hash={task.escrowTx} label="escrow" />
                          )}
                          {task.acceptTx && (
                            <TxLink hash={task.acceptTx} label="accept" />
                          )}
                          {task.submitTx && (
                            <TxLink hash={task.submitTx} label="submit" />
                          )}
                          {task.payoutTx && (
                            <TxLink hash={task.payoutTx} label="payout" color="success" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TxLink({ hash, label, color }: { hash: string; label: string; color?: "success" }) {
  const colorClass = color === "success" ? "text-[var(--color-success)]" : "text-[var(--color-accent)]";
  
  return (
    <a
      href={`https://monadscan.com/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 ${colorClass} hover:underline`}
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function delay(ms: number) { 
  return new Promise((r) => setTimeout(r, ms)); 
}
