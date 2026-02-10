import type { Hex } from "viem";
import { Agent } from "../../shared/agent.js";
import { taskStore } from "../../shared/taskStore.js";
import { sendMON } from "../../shared/monad.js";

// ─── Requester Agent ────────────────────────────────────────────────
// Creates tasks, confirms completion, and pays workers.
// See skills.md for the skill definitions.

export function createRequesterAgent(
  walletAddress: string,
  privateKey: Hex
): Agent {
  const agent = new Agent("RequesterAgent", walletAddress);

  // ── Skill: create_task ──────────────────────────────────────────
  agent.registerSkill(
    "create_task",
    "Create a new task with a title and MON reward",
    (title: string, reward: string) => {
      const task = taskStore.create(title, reward, walletAddress);
      agent.log(`📋 Task created: "${task.title}" | Reward: ${task.reward} MON | ID: ${task.id}`);
      agent.emitEvent("task:created", {
        taskId: task.id,
        title: task.title,
        reward: task.reward,
      });
      return task;
    }
  );

  // ── Skill: confirm_completion ───────────────────────────────────
  agent.registerSkill(
    "confirm_completion",
    "Confirm a completed task and send MON payment to worker",
    async (taskId: string) => {
      // 1. Confirm the task
      const task = taskStore.confirm(taskId, walletAddress);
      agent.log(`✔️  Task confirmed: ${task.id}`);
      agent.emitEvent("task:confirmed", { taskId: task.id });

      // 2. Send payment to the worker
      if (!task.worker) {
        throw new Error(`Task ${taskId} has no assigned worker`);
      }

      agent.log(`💰 Initiating payment of ${task.reward} MON to ${task.worker}...`);
      const payment = await sendMON(privateKey, task.worker as Hex, task.reward);

      // 3. Mark task as paid
      taskStore.markPaid(taskId, payment.txHash);
      agent.log(`🎉 Payment sent! Tx: ${payment.txHash}`);
      agent.emitEvent("payment:sent", {
        taskId: task.id,
        txHash: payment.txHash,
        amount: task.reward,
        to: task.worker,
      });

      return payment;
    }
  );

  return agent;
}
