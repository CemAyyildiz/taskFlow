import "dotenv/config";
import type { Hex } from "viem";
import { createRequesterAgent } from "../agents/requester-agent/agent.js";
import { createWorkerAgent } from "../agents/worker-agent/agent.js";
import { addressFromKey, getBalance } from "../shared/monad.js";
import { taskStore } from "../shared/taskStore.js";

// ─── Helpers ────────────────────────────────────────────────────────
const separator = () => console.log("\n" + "═".repeat(60) + "\n");

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Missing environment variable: ${key}`);
    console.error(`   Copy .env.example → .env and fill in your keys.`);
    process.exit(1);
  }
  return val;
}

// ─── Main Demo ──────────────────────────────────────────────────────
async function main() {
  console.log("⚡ TaskFlow — Demo");
  console.log("   Network: Monad Testnet (Chain ID: 10143)");
  separator();

  // 1. Load wallets from .env
  const requesterKey = requireEnv("REQUESTER_PRIVATE_KEY") as Hex;
  const workerKey = requireEnv("WORKER_PRIVATE_KEY") as Hex;

  const requesterAddress = addressFromKey(requesterKey);
  const workerAddress = addressFromKey(workerKey);

  console.log(`👤 Requester: ${requesterAddress}`);
  console.log(`👷 Worker:    ${workerAddress}`);

  // Show balances
  const [reqBal, workerBal] = await Promise.all([
    getBalance(requesterAddress),
    getBalance(workerAddress),
  ]);
  console.log(`   Requester balance: ${reqBal} MON`);
  console.log(`   Worker balance:    ${workerBal} MON`);
  separator();

  // 2. Create agents
  const requester = createRequesterAgent(requesterAddress, requesterKey);
  const worker = createWorkerAgent(workerAddress);

  // 3. Wire up event-driven communication between agents
  //    Worker listens for new tasks and auto-accepts
  worker.subscribe(requester, "task:created", async (event) => {
    console.log(`\n📢 WorkerAgent heard: new task "${event.title}" (${event.taskId})`);
  });

  //    Requester listens for task completion and auto-confirms
  requester.subscribe(worker, "task:completed", async (event) => {
    console.log(`\n📢 RequesterAgent heard: task ${event.taskId} completed by worker`);
  });

  //    Worker listens for payment
  worker.subscribe(requester, "payment:sent", async (event) => {
    console.log(`\n📢 WorkerAgent heard: payment received! Tx: ${event.txHash}`);
  });

  separator();

  // ── STEP 1: Requester creates a task ────────────────────────────
  console.log("📌 STEP 1 — Requester creates a task");
  const task = await requester.executeSkill("create_task", "Write a smart contract audit report", "0.01");
  separator();

  // ── STEP 2: Worker accepts the task ─────────────────────────────
  console.log("📌 STEP 2 — Worker accepts the task");
  await worker.executeSkill("accept_task", task.id);
  separator();

  // ── STEP 3: Worker completes the task ───────────────────────────
  console.log("📌 STEP 3 — Worker completes the task");
  await worker.executeSkill("complete_task", task.id);
  separator();

  // ── STEP 4: Requester confirms & pays ───────────────────────────
  console.log("📌 STEP 4 — Requester confirms completion & sends payment");
  const payment = await requester.executeSkill("confirm_completion", task.id);
  separator();

  // ── Summary ─────────────────────────────────────────────────────
  console.log("🏁 DEMO COMPLETE — Task Lifecycle Summary");
  const finalTask = taskStore.get(task.id)!;
  console.log(`   Task:     "${finalTask.title}"`);
  console.log(`   Status:   ${finalTask.status}`);
  console.log(`   Reward:   ${finalTask.reward} MON`);
  console.log(`   Worker:   ${finalTask.worker}`);
  console.log(`   Tx Hash:  ${finalTask.paymentTx}`);
  console.log(`   Explorer: https://testnet.monadscan.com/tx/${finalTask.paymentTx}`);
  separator();

  // Show final balances
  const [reqBalFinal, workerBalFinal] = await Promise.all([
    getBalance(requesterAddress),
    getBalance(workerAddress),
  ]);
  console.log("💰 Final Balances:");
  console.log(`   Requester: ${reqBalFinal} MON`);
  console.log(`   Worker:    ${workerBalFinal} MON`);
  console.log("\n✅ Hackathon MVP — Done!");
}

main().catch((err) => {
  console.error("\n❌ Demo failed:", err.message ?? err);
  process.exit(1);
});
