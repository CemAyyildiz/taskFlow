/**
 * Real on-chain test for TaskFlow contract
 * This actually sends MON and interacts with the deployed contract
 */

import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monad } from "viem/chains";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PLATFORM_KEY = process.env.PRIVATE_KEY;

if (!CONTRACT_ADDRESS || !PLATFORM_KEY) {
  console.error("Missing env vars: CONTRACT_ADDRESS, PRIVATE_KEY");
  process.exit(1);
}

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
];

const publicClient = createPublicClient({
  chain: monad,
  transport: http(),
});

const platformAccount = privateKeyToAccount(PLATFORM_KEY);

// For demo: platform is both requester and worker (same wallet, but in real usage they'd be different)
const requesterAccount = platformAccount;
const workerAccount = platformAccount;

const requesterWallet = createWalletClient({
  account: requesterAccount,
  chain: monad,
  transport: http(),
});

const workerWallet = requesterWallet; // same wallet for demo

const platformWallet = requesterWallet; // same wallet (contract owner)

const STATUS = ["OPEN", "ACCEPTED", "SUBMITTED", "DONE", "CANCELLED"];

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("       🔗 TASKFLOW ON-CHAIN TEST — MONAD MAINNET");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Requester: ${requesterAccount.address}`);
  console.log(`Worker: ${workerAccount.address}`);
  console.log(`Platform: ${platformAccount.address}\n`);

  // Check balances
  const requesterBal = await publicClient.getBalance({ address: requesterAccount.address });
  const workerBal = await publicClient.getBalance({ address: workerAccount.address });
  
  console.log(`Requester balance: ${formatEther(requesterBal)} MON`);
  console.log(`Worker balance: ${formatEther(workerBal)} MON\n`);

  // Generate unique task ID
  const taskId = `task_${Date.now()}`;
  const rewardMON = "0.01";

  // ─── Step 1: Requester creates task (sends escrow) ─────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 1: Requester creates task + pays escrow");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`  Task ID: ${taskId}`);
  console.log(`  Reward: ${rewardMON} MON`);
  console.log(`  Sending tx...`);

  const createHash = await requesterWallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "createTask",
    args: [taskId],
    value: parseEther(rewardMON),
  });

  console.log(`  📤 Tx: ${createHash}`);
  console.log(`  Waiting for confirmation...`);

  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  console.log(`  ✅ Confirmed in block ${createReceipt.blockNumber}`);
  console.log(`  🔗 https://monadscan.com/tx/${createHash}\n`);

  // Check task on-chain
  let task = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getTask",
    args: [taskId],
  });
  console.log(`  On-chain status: ${STATUS[task[3]]}`);
  console.log(`  Contract balance: ${formatEther(task[2])} MON escrowed\n`);

  // Register with platform API
  await fetch("http://localhost:3001/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskId,
      title: "On-Chain Test Task",
      description: "Testing full contract flow",
      reward: rewardMON,
      requester: requesterAccount.address,
      txHash: createHash,
    }),
  });

  // ─── Step 2: Worker accepts task ───────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 2: Worker accepts task");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`  Worker: ${workerAccount.address}`);
  console.log(`  Sending tx...`);

  const acceptHash = await workerWallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "acceptTask",
    args: [taskId],
  });

  console.log(`  📤 Tx: ${acceptHash}`);
  const acceptReceipt = await publicClient.waitForTransactionReceipt({ hash: acceptHash });
  console.log(`  ✅ Confirmed in block ${acceptReceipt.blockNumber}`);
  console.log(`  🔗 https://monadscan.com/tx/${acceptHash}\n`);

  task = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getTask",
    args: [taskId],
  });
  console.log(`  On-chain status: ${STATUS[task[3]]}`);
  console.log(`  Worker on-chain: ${task[1]}\n`);

  // Notify platform
  await fetch(`http://localhost:3001/tasks/${taskId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker: workerAccount.address, txHash: acceptHash }),
  });

  // ─── Step 3: Worker submits result ─────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("STEP 3: Worker submits result");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const result = JSON.stringify({ status: "completed", data: "test result", timestamp: Date.now() });
  console.log(`  Result: ${result.slice(0, 50)}...`);
  console.log(`  Sending tx...`);

  const submitHash = await workerWallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "submitTask",
    args: [taskId, result],
  });

  console.log(`  📤 Tx: ${submitHash}`);
  const submitReceipt = await publicClient.waitForTransactionReceipt({ hash: submitHash });
  console.log(`  ✅ Confirmed in block ${submitReceipt.blockNumber}`);
  console.log(`  🔗 https://monadscan.com/tx/${submitHash}\n`);

  task = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getTask",
    args: [taskId],
  });
  console.log(`  On-chain status: ${STATUS[task[3]]}\n`);

  // Notify platform (this triggers auto-payout)
  await fetch(`http://localhost:3001/tasks/${taskId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker: workerAccount.address, result, txHash: submitHash }),
  });

  console.log("  ⏳ Platform will now release payout (2s delay)...\n");
  await new Promise(r => setTimeout(r, 5000));

  // ─── Final check ───────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("FINAL: Check on-chain state");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  task = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getTask",
    args: [taskId],
  });

  console.log(`  Task ID: ${taskId}`);
  console.log(`  Status: ${STATUS[task[3]]}`);
  console.log(`  Requester: ${task[0]}`);
  console.log(`  Worker: ${task[1]}`);
  console.log(`  Reward: ${formatEther(task[2])} MON`);

  const contractBal = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getBalance",
  });
  console.log(`\n  Contract escrow balance: ${formatEther(contractBal)} MON`);

  const workerFinalBal = await publicClient.getBalance({ address: workerAccount.address });
  console.log(`  Worker final balance: ${formatEther(workerFinalBal)} MON`);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("       ✅ ON-CHAIN TEST COMPLETE");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
