import dotenv from "dotenv";
import { resolve } from "node:path";

// Load .env from project root (skip if env vars already set, e.g. Railway)
if (!process.env.PRIVATE_KEY) {
  dotenv.config({ path: resolve(import.meta.dirname ?? ".", "../../.env") });
}

import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import type { Hex } from "viem";
import {
  formatEther,
  parseEther,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monad } from "viem/chains";

// ─── Crash Guards ───────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("⚠️  Uncaught exception (kept alive):", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled rejection (kept alive):", reason);
});

// ─── Config ─────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as Hex;

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not set in .env");
  process.exit(1);
}

if (!CONTRACT_ADDRESS) {
  console.error("❌ CONTRACT_ADDRESS not set in .env");
  process.exit(1);
}

// ─── Contract ABI ───────────────────────────────────────────────────
const ABI = [
  {
    type: "function",
    name: "createTask",
    inputs: [{ name: "taskId", type: "string" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "acceptTask",
    inputs: [{ name: "taskId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitTask",
    inputs: [
      { name: "taskId", type: "string" },
      { name: "result", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releasePayout",
    inputs: [{ name: "taskId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getTask",
    inputs: [{ name: "taskId", type: "string" }],
    outputs: [
      { name: "requester", type: "address" },
      { name: "worker", type: "address" },
      { name: "reward", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "result", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const ContractStatus = ["OPEN", "ACCEPTED", "SUBMITTED", "DONE", "CANCELLED"] as const;

// ─── Viem Clients ───────────────────────────────────────────────────
const account = privateKeyToAccount(PRIVATE_KEY);
const PLATFORM_ADDRESS = account.address;

const publicClient = createPublicClient({
  chain: monad,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: monad,
  transport: http(),
});

// ─── In-Memory Task Cache ───────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  requester: string;
  worker: string | null;
  status: string;
  result: string | null;
  escrowTx: string | null;
  acceptTx: string | null;
  submitTx: string | null;
  payoutTx: string | null;
  createdAt: string;
}

const tasks = new Map<string, Task>();

// ─── SSE ────────────────────────────────────────────────────────────
type SSEClient = { id: string; res: express.Response };
const sseClients: SSEClient[] = [];

function broadcast(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((c) => {
    try { c.res.write(msg); } catch { /* stale */ }
  });
}

// ─── Contract Helpers ───────────────────────────────────────────────
async function getTaskFromContract(taskId: string): Promise<Task | undefined> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getTask",
      args: [taskId],
    });
    const [requester, worker, reward, status, taskResult] = result;
    if (requester === "0x0000000000000000000000000000000000000000") return undefined;

    const cached = tasks.get(taskId);
    return {
      id: taskId,
      title: cached?.title ?? taskId,
      description: cached?.description ?? "",
      reward: formatEther(reward),
      requester,
      worker: worker === "0x0000000000000000000000000000000000000000" ? null : worker,
      status: ContractStatus[status] ?? "UNKNOWN",
      result: taskResult || null,
      escrowTx: cached?.escrowTx ?? null,
      acceptTx: cached?.acceptTx ?? null,
      submitTx: cached?.submitTx ?? null,
      payoutTx: cached?.payoutTx ?? null,
      createdAt: cached?.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

let cachedContractBalance = "0";
async function refreshContractBalance() {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getBalance",
    });
    cachedContractBalance = formatEther(balance);
  } catch { /* keep stale */ }
}
refreshContractBalance();
setInterval(refreshContractBalance, 10_000);

// ─── Express App ────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════════════════════════
// HEALTH & INFO
// ══════════════════════════════════════════════════════════════════════

app.get("/health", async (_req, res) => {
  await refreshContractBalance();
  const taskList = Array.from(tasks.values());
  res.json({
    status: "ok",
    platform: PLATFORM_ADDRESS,
    contract: CONTRACT_ADDRESS,
    escrowBalance: cachedContractBalance,
    chain: "monad-mainnet",
    chainId: 143,
    explorer: `https://monadscan.com/address/${CONTRACT_ADDRESS}`,
    tasks: {
      total: taskList.length,
      open: taskList.filter((t) => t.status === "OPEN").length,
      accepted: taskList.filter((t) => t.status === "ACCEPTED").length,
      submitted: taskList.filter((t) => t.status === "SUBMITTED").length,
      done: taskList.filter((t) => t.status === "DONE").length,
    },
  });
});

app.get("/skill.md", (_req, res) => {
  try {
    const skillPath = resolve(import.meta.dirname ?? ".", "../../ui/public/skill.md");
    res.type("text/markdown").send(readFileSync(skillPath, "utf-8"));
  } catch {
    res.status(404).send("# skill.md not found");
  }
});

// ══════════════════════════════════════════════════════════════════════
// ON-CHAIN TASK ENDPOINTS — Real blockchain transactions
// ══════════════════════════════════════════════════════════════════════

/**
 * POST /tasks — Create task ON-CHAIN
 * Platform sends MON to contract as escrow
 * 
 * Body: { title, description?, reward, requester }
 * Returns: Task with escrowTx (on-chain tx hash)
 */
app.post("/tasks", async (req, res) => {
  try {
    const { title, description, reward, requester } = req.body;

    if (!title || !reward || !requester) {
      res.status(400).json({ error: "Missing: title, reward, requester" });
      return;
    }

    const rewardNum = parseFloat(reward);
    if (isNaN(rewardNum) || rewardNum <= 0) {
      res.status(400).json({ error: "Invalid reward amount" });
      return;
    }

    // Generate unique task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📥 CREATE TASK (on-chain)`);
    console.log(`  Title: "${title}"`);
    console.log(`  Reward: ${reward} MON`);
    console.log(`  Requester: ${requester}`);
    console.log(`  Task ID: ${taskId}`);

    // Send tx to contract — pays escrow
    console.log(`  ⏳ Sending tx to contract...`);
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "createTask",
      args: [taskId],
      value: parseEther(reward),
    });
    console.log(`  📤 Tx: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`  🔗 https://monadscan.com/tx/${hash}`);

    // Store in cache
    const task: Task = {
      id: taskId,
      title,
      description: description ?? "",
      reward,
      requester,
      worker: null,
      status: "OPEN",
      result: null,
      escrowTx: hash,
      acceptTx: null,
      submitTx: null,
      payoutTx: null,
      createdAt: new Date().toISOString(),
    };
    tasks.set(taskId, task);
    broadcast("task:created", task);
    refreshContractBalance();

    res.status(201).json(task);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /tasks/:id/accept — Accept task ON-CHAIN
 * 
 * Body: { worker }
 * Returns: Task with acceptTx (on-chain tx hash)
 */
app.post("/tasks/:id/accept", async (req, res) => {
  try {
    const { worker } = req.body;
    const taskId = req.params.id;

    if (!worker) {
      res.status(400).json({ error: "Missing: worker" });
      return;
    }

    let task = tasks.get(taskId);
    if (!task) {
      task = await getTaskFromContract(taskId);
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
    }

    if (task.status !== "OPEN") {
      res.status(400).json({ error: `Task is ${task.status}, not OPEN` });
      return;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🤝 ACCEPT TASK (on-chain)`);
    console.log(`  Task ID: ${taskId}`);
    console.log(`  Worker: ${worker}`);

    // Send tx to contract
    console.log(`  ⏳ Sending tx to contract...`);
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "acceptTask",
      args: [taskId],
    });
    console.log(`  📤 Tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`  🔗 https://monadscan.com/tx/${hash}`);

    // Update cache
    task.worker = worker;
    task.status = "ACCEPTED";
    task.acceptTx = hash;
    tasks.set(taskId, task);
    broadcast("task:updated", task);

    res.json(task);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /tasks/:id/submit — Submit result ON-CHAIN
 * Then platform auto-releases payment
 * 
 * Body: { worker, result }
 * Returns: Task with submitTx (on-chain tx hash)
 */
app.post("/tasks/:id/submit", async (req, res) => {
  try {
    const { worker, result } = req.body;
    const taskId = req.params.id;

    if (!worker || !result) {
      res.status(400).json({ error: "Missing: worker, result" });
      return;
    }

    let task = tasks.get(taskId);
    if (!task) {
      task = await getTaskFromContract(taskId);
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
    }

    if (task.status !== "ACCEPTED") {
      res.status(400).json({ error: `Task is ${task.status}, not ACCEPTED` });
      return;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 SUBMIT RESULT (on-chain)`);
    console.log(`  Task ID: ${taskId}`);
    console.log(`  Worker: ${worker}`);
    console.log(`  Result: ${result.slice(0, 80)}...`);

    // Send tx to contract
    console.log(`  ⏳ Sending tx to contract...`);
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "submitTask",
      args: [taskId, result],
    });
    console.log(`  📤 Tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`  🔗 https://monadscan.com/tx/${hash}`);

    // Update cache
    task.result = result;
    task.status = "SUBMITTED";
    task.submitTx = hash;
    tasks.set(taskId, task);
    broadcast("task:updated", task);

    // Auto-release payment (platform's job)
    setTimeout(() => releasePayout(taskId), 1500);

    res.json(task);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Release payout to worker (called automatically after submit)
 */
async function releasePayout(taskId: string) {
  const task = tasks.get(taskId);
  if (!task || task.status !== "SUBMITTED") return;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💸 RELEASE PAYOUT (on-chain)`);
  console.log(`  Task ID: ${taskId}`);
  console.log(`  Worker: ${task.worker}`);
  console.log(`  Amount: ${task.reward} MON`);

  try {
    console.log(`  ⏳ Sending tx to contract...`);
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "releasePayout",
      args: [taskId],
    });
    console.log(`  📤 Tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`  🔗 https://monadscan.com/tx/${hash}`);

    // Update cache
    task.status = "DONE";
    task.payoutTx = hash;
    tasks.set(taskId, task);
    broadcast("task:updated", task);
    refreshContractBalance();

    console.log(`  🎉 Worker received ${task.reward} MON`);
  } catch (err: any) {
    console.error(`  ❌ Payout failed: ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════
// QUERY ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

app.get("/tasks", (req, res) => {
  const status = req.query.status as string | undefined;
  let taskList = Array.from(tasks.values());
  if (status) {
    taskList = taskList.filter((t) => t.status.toUpperCase() === status.toUpperCase());
  }
  taskList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(taskList);
});

app.get("/tasks/:id", async (req, res) => {
  let task = tasks.get(req.params.id);
  if (!task) task = await getTaskFromContract(req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

// ══════════════════════════════════════════════════════════════════════
// SSE
// ══════════════════════════════════════════════════════════════════════

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Math.random().toString(36).slice(2);
  sseClients.push({ id: clientId, res });
  console.log(`📡 SSE connected: ${clientId}`);

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  req.on("close", () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ─── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                    ◆ TASKFLOW PLATFORM (ON-CHAIN) ◆                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Platform  : ${PLATFORM_ADDRESS}                    ║
║  Contract  : ${CONTRACT_ADDRESS}                    ║
║  Network   : Monad Mainnet (Chain 143)                                ║
║  Port      : ${String(PORT).padEnd(57)}║
║  Escrow    : ${cachedContractBalance.slice(0, 10).padEnd(47)} MON      ║
╠═══════════════════════════════════════════════════════════════════════╣
║  ALL API CALLS EXECUTE REAL ON-CHAIN TRANSACTIONS                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║  POST /tasks              → contract.createTask() + escrow            ║
║  POST /tasks/:id/accept   → contract.acceptTask()                     ║
║  POST /tasks/:id/submit   → contract.submitTask() + auto payout       ║
║  GET  /tasks              → list all tasks                            ║
║  GET  /tasks/:id          → get single task (cache + chain)           ║
║  GET  /events             → SSE real-time updates                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Explorer: https://monadscan.com/address/${CONTRACT_ADDRESS.slice(0, 20)}   ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);
});
