import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Hex } from "viem";
import { taskStore } from "../../shared/taskStore.js";
import { TaskStatus } from "../../shared/types.js";
import type { Task } from "../../shared/types.js";
import { sendMON, getBalance, addressFromKey, getPublicClient } from "../../shared/monad.js";

// ─── Config ─────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
const AGENT_KEY = process.env.AGENT_PRIVATE_KEY as Hex | undefined;
const AGENT_ADDR = AGENT_KEY ? addressFromKey(AGENT_KEY) : null;
const MONITOR_INTERVAL = 10_000; // 10s

// ─── SSE Client Pool ────────────────────────────────────────────────
const sseClients = new Set<express.Response>();

function broadcast(event: string, data: unknown): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [TaskFlow] ⚡ ${event}`);
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [TaskFlow] ${msg}`);
}

// ─── Express App ────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    agent: "taskflow",
    version: "0.1.0",
    wallet: AGENT_ADDR ?? "not configured",
    uptime: process.uptime(),
    tasks: taskStore.list().length,
  });
});

// ── Serve skill.md ──────────────────────────────────────────────────
app.get("/skill.md", (_req, res) => {
  try {
    const __dirname = resolve(fileURLToPath(import.meta.url), "..");
    const skillPath = resolve(__dirname, "../../ui/public/skill.md");
    const content = readFileSync(skillPath, "utf-8");
    res.type("text/markdown").send(content);
  } catch {
    res.status(404).send("skill.md not found");
  }
});

// ── SSE Event Stream ────────────────────────────────────────────────
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial heartbeat
  res.write(`event: connected\ndata: ${JSON.stringify({ agent: "taskflow", ts: Date.now() })}\n\n`);

  sseClients.add(res);
  req.on("close", () => {
    sseClients.delete(res);
  });
});

// ── Create Task ─────────────────────────────────────────────────────
app.post("/tasks", (req, res) => {
  const { title, reward, requester } = req.body;

  if (!title || !reward || !requester) {
    return res.status(400).json({ error: "Missing required fields: title, reward, requester" });
  }
  if (isNaN(Number(reward)) || Number(reward) <= 0) {
    return res.status(400).json({ error: "Reward must be a positive number" });
  }
  if (!requester.startsWith("0x")) {
    return res.status(400).json({ error: "Requester must be a valid wallet address" });
  }

  const task = taskStore.create(title, reward, requester);
  log(`📋 Task created: "${task.title}" → ${task.reward} MON (${task.id})`);
  broadcast("task:created", task);
  return res.status(201).json(task);
});

// ── List Tasks ──────────────────────────────────────────────────────
app.get("/tasks", (req, res) => {
  const status = req.query.status as string | undefined;
  const tasks = status ? taskStore.list(status as TaskStatus) : taskStore.list();
  res.json(tasks);
});

// ── Get Task ────────────────────────────────────────────────────────
app.get("/tasks/:id", (req, res) => {
  const task = taskStore.get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  return res.json(task);
});

// ── Accept Task ─────────────────────────────────────────────────────
app.post("/tasks/:id/accept", (req, res) => {
  const { worker } = req.body;
  if (!worker) return res.status(400).json({ error: "Missing worker address" });

  try {
    const task = taskStore.accept(req.params.id, worker);
    log(`🤝 Task accepted: ${task.id} → worker ${worker}`);
    broadcast("task:accepted", task);
    return res.json(task);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

// ── Complete Task ───────────────────────────────────────────────────
app.post("/tasks/:id/complete", (req, res) => {
  const { worker } = req.body;
  if (!worker) return res.status(400).json({ error: "Missing worker address" });

  try {
    const task = taskStore.complete(req.params.id, worker);
    log(`✅ Task completed: ${task.id}`);
    broadcast("task:completed", task);
    return res.json(task);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

// ── Confirm & Pay ───────────────────────────────────────────────────
app.post("/tasks/:id/confirm", async (req, res) => {
  const { requester } = req.body;
  if (!requester) return res.status(400).json({ error: "Missing requester address" });

  try {
    const task = taskStore.confirm(req.params.id, requester);
    log(`✔️  Task confirmed: ${task.id}`);
    broadcast("task:confirmed", task);

    // Trigger MON payment if agent wallet is configured
    if (AGENT_KEY && task.worker) {
      log(`💰 Sending ${task.reward} MON → ${task.worker}`);
      try {
        const payment = await sendMON(AGENT_KEY, task.worker as Hex, task.reward);
        taskStore.markPaid(task.id, payment.txHash);
        log(`🎉 Paid! tx: ${payment.txHash}`);
        broadcast("payment:sent", {
          taskId: task.id,
          txHash: payment.txHash,
          amount: task.reward,
          from: AGENT_ADDR,
          to: task.worker,
        });
        return res.json({ ...taskStore.get(task.id), paymentTx: payment.txHash });
      } catch (payErr: any) {
        log(`❌ Payment failed: ${payErr.message}`);
        broadcast("payment:failed", { taskId: task.id, error: payErr.message });
        return res.status(500).json({ error: `Task confirmed but payment failed: ${payErr.message}`, task });
      }
    }

    return res.json(task);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

// ─── Autonomous Monitor Loop ────────────────────────────────────────
// The agent periodically checks for stuck/stale tasks and reports status.
async function monitorLoop(): Promise<void> {
  log("🔄 Monitor: scanning tasks...");

  const all = taskStore.list();
  const open = all.filter((t) => t.status === TaskStatus.Open);
  const accepted = all.filter((t) => t.status === TaskStatus.Accepted);
  const completed = all.filter((t) => t.status === TaskStatus.Completed);
  const paid = all.filter((t) => t.status === TaskStatus.Paid);

  // Check for stale tasks (open for more than 5 minutes)
  const STALE_MS = 5 * 60 * 1000;
  const now = Date.now();
  for (const task of open) {
    if (now - task.createdAt > STALE_MS) {
      log(`⚠️  Stale task detected: ${task.id} "${task.title}" — open for ${Math.round((now - task.createdAt) / 1000)}s`);
      broadcast("monitor:stale_task", { taskId: task.id, title: task.title, age: now - task.createdAt });
    }
  }

  // Check for tasks stuck in completed (not confirmed for 2+ minutes)
  const STUCK_MS = 2 * 60 * 1000;
  for (const task of completed) {
    if (now - task.updatedAt > STUCK_MS) {
      log(`⚠️  Task awaiting confirmation: ${task.id} — completed ${Math.round((now - task.updatedAt) / 1000)}s ago`);
      broadcast("monitor:awaiting_confirm", { taskId: task.id, title: task.title, age: now - task.updatedAt });
    }
  }

  // Report wallet balance if configured
  if (AGENT_ADDR) {
    try {
      const balance = await getBalance(AGENT_ADDR);
      log(`💳 Agent wallet: ${AGENT_ADDR} — ${balance} MON`);
    } catch {
      log(`💳 Agent wallet: could not fetch balance`);
    }
  }

  log(`📊 Tasks: ${open.length} open, ${accepted.length} active, ${completed.length} done, ${paid.length} paid (${all.length} total)`);
}

// ─── Startup ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  ⚡ TaskFlow Agent v0.1.0");
  console.log("  ─────────────────────────────────────");
  console.log(`  API:        http://localhost:${PORT}`);
  console.log(`  Events:     http://localhost:${PORT}/events`);
  console.log(`  Skill file: http://localhost:${PORT}/skill.md`);
  console.log(`  Health:     http://localhost:${PORT}/health`);
  console.log(`  Wallet:     ${AGENT_ADDR ?? "not configured (set AGENT_PRIVATE_KEY)"}`);
  console.log(`  Network:    Monad Testnet (Chain ID: 10143)`);
  console.log("  ─────────────────────────────────────");
  console.log("");

  // Start autonomous monitor
  monitorLoop();
  setInterval(monitorLoop, MONITOR_INTERVAL);
});
