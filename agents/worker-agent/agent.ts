import { Agent } from "../../shared/agent.js";
import { taskStore } from "../../shared/taskStore.js";

// ─── Worker Agent ───────────────────────────────────────────────────
// Accepts tasks and marks them as completed.
// See skills.md for the skill definitions.

export function createWorkerAgent(walletAddress: string): Agent {
  const agent = new Agent("WorkerAgent", walletAddress);

  // ── Skill: accept_task ──────────────────────────────────────────
  agent.registerSkill(
    "accept_task",
    "Accept an open task from the marketplace",
    (taskId: string) => {
      const task = taskStore.accept(taskId, walletAddress);
      agent.log(`🤝 Task accepted: "${task.title}" (ID: ${task.id})`);
      agent.emitEvent("task:accepted", {
        taskId: task.id,
        worker: walletAddress,
      });
      return task;
    }
  );

  // ── Skill: complete_task ────────────────────────────────────────
  agent.registerSkill(
    "complete_task",
    "Mark an accepted task as completed",
    (taskId: string) => {
      const task = taskStore.complete(taskId, walletAddress);
      agent.log(`✅ Task completed: "${task.title}" (ID: ${task.id})`);
      agent.emitEvent("task:completed", {
        taskId: task.id,
        worker: walletAddress,
      });
      return task;
    }
  );

  return agent;
}
