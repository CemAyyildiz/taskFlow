#!/usr/bin/env node
/**
 * Test TaskFlow API — Full On-Chain Flow
 * This script tests the platform API endpoints that trigger real blockchain transactions
 */

const API = "http://localhost:3001";

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("      TaskFlow API Test — Full On-Chain Flow");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Step 1: Health check
  console.log("📋 Step 1: Health Check\n");
  const health = await fetch(`${API}/health`).then((r) => r.json());
  console.log("Platform:", health.platform);
  console.log("Contract:", health.contract);
  console.log("Chain:", health.chain);
  console.log("Escrow Balance:", health.escrowBalance, "MON");
  console.log("Explorer:", health.explorer);

  // Step 2: Create Task (on-chain)
  console.log("\n───────────────────────────────────────────────────────────");
  console.log("📥 Step 2: Create Task (on-chain)\n");
  
  const createRes = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Summarize Web3 Article",
      description: "Read and summarize the latest Web3 article from CoinDesk",
      reward: "0.001",
      requester: "agent://demo-requester-001",
    }),
  });
  
  const task = await createRes.json();
  if (!createRes.ok) {
    console.error("❌ Failed to create task:", task);
    process.exit(1);
  }
  
  console.log("Task ID:", task.id);
  console.log("Title:", task.title);
  console.log("Reward:", task.reward, "MON");
  console.log("Status:", task.status);
  console.log("Escrow Tx:", task.escrowTx);
  console.log("🔗 https://monadscan.com/tx/" + task.escrowTx);

  // Step 3: Accept Task (on-chain)
  console.log("\n───────────────────────────────────────────────────────────");
  console.log("🤝 Step 3: Accept Task (on-chain)\n");
  
  const acceptRes = await fetch(`${API}/tasks/${task.id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      worker: "agent://demo-worker-002",
    }),
  });
  
  const accepted = await acceptRes.json();
  if (!acceptRes.ok) {
    console.error("❌ Failed to accept task:", accepted);
    process.exit(1);
  }
  
  console.log("Task ID:", accepted.id);
  console.log("Worker:", accepted.worker);
  console.log("Status:", accepted.status);
  console.log("Accept Tx:", accepted.acceptTx);
  console.log("🔗 https://monadscan.com/tx/" + accepted.acceptTx);

  // Step 4: Submit Result (on-chain + auto payout)
  console.log("\n───────────────────────────────────────────────────────────");
  console.log("📦 Step 4: Submit Result (on-chain + auto payout)\n");
  
  const submitRes = await fetch(`${API}/tasks/${task.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      worker: "agent://demo-worker-002",
      result: "Summary: Web3 is evolving rapidly with DeFi, NFTs, and decentralized infrastructure. Key trends include AI integration and real-world asset tokenization.",
    }),
  });
  
  const submitted = await submitRes.json();
  if (!submitRes.ok) {
    console.error("❌ Failed to submit task:", submitted);
    process.exit(1);
  }
  
  console.log("Task ID:", submitted.id);
  console.log("Result:", submitted.result.slice(0, 60) + "...");
  console.log("Status:", submitted.status);
  console.log("Submit Tx:", submitted.submitTx);
  console.log("🔗 https://monadscan.com/tx/" + submitted.submitTx);

  // Wait for auto payout
  console.log("\n⏳ Waiting for auto payout...");
  await new Promise((r) => setTimeout(r, 4000));

  // Step 5: Verify final state
  console.log("\n───────────────────────────────────────────────────────────");
  console.log("✅ Step 5: Verify Final State\n");
  
  const final = await fetch(`${API}/tasks/${task.id}`).then((r) => r.json());
  
  console.log("Task ID:", final.id);
  console.log("Title:", final.title);
  console.log("Reward:", final.reward, "MON");
  console.log("Status:", final.status);
  console.log("Requester:", final.requester);
  console.log("Worker:", final.worker);
  console.log("");
  console.log("TRANSACTION HISTORY:");
  console.log("├─ Escrow Tx:", final.escrowTx);
  console.log("├─ Accept Tx:", final.acceptTx);
  console.log("├─ Submit Tx:", final.submitTx);
  console.log("└─ Payout Tx:", final.payoutTx);

  if (final.status === "DONE" && final.payoutTx) {
    console.log("\n🎉 SUCCESS! Full on-chain flow completed!");
    console.log("🔗 All transactions visible on Monadscan:");
    console.log("   https://monadscan.com/tx/" + final.escrowTx);
    console.log("   https://monadscan.com/tx/" + final.acceptTx);
    console.log("   https://monadscan.com/tx/" + final.submitTx);
    console.log("   https://monadscan.com/tx/" + final.payoutTx);
  } else {
    console.log("\n⚠️  Flow not complete. Status:", final.status);
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
