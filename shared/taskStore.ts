import { Task, TaskStatus } from "./types.js";
import { randomUUID } from "node:crypto";

// ─── In-Memory Task Store ───────────────────────────────────────────
class TaskStore {
  private tasks: Map<string, Task> = new Map();

  /** Create a new task and return it */
  create(title: string, reward: string, requesterAddress: string): Task {
    const task: Task = {
      id: randomUUID().slice(0, 8),
      title,
      reward,
      status: TaskStatus.Open,
      requester: requesterAddress,
      worker: null,
      paymentTx: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  /** Get a task by ID */
  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /** List all tasks, optionally filtered by status */
  list(status?: TaskStatus): Task[] {
    const all = [...this.tasks.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }

  /** Worker accepts an open task */
  accept(taskId: string, workerAddress: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Open) {
      throw new Error(`Task ${taskId} is not open (status: ${task.status})`);
    }
    task.status = TaskStatus.Accepted;
    task.worker = workerAddress;
    task.updatedAt = Date.now();
    return task;
  }

  /** Worker marks task as completed */
  complete(taskId: string, workerAddress: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Accepted) {
      throw new Error(`Task ${taskId} is not accepted (status: ${task.status})`);
    }
    if (task.worker !== workerAddress) {
      throw new Error(`Only the assigned worker can complete task ${taskId}`);
    }
    task.status = TaskStatus.Completed;
    task.updatedAt = Date.now();
    return task;
  }

  /** Requester confirms task completion */
  confirm(taskId: string, requesterAddress: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Completed) {
      throw new Error(`Task ${taskId} is not completed (status: ${task.status})`);
    }
    if (task.requester !== requesterAddress) {
      throw new Error(`Only the requester can confirm task ${taskId}`);
    }
    task.status = TaskStatus.Confirmed;
    task.updatedAt = Date.now();
    return task;
  }

  /** Mark task as paid after successful token transfer */
  markPaid(taskId: string, txHash: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Confirmed) {
      throw new Error(`Task ${taskId} is not confirmed (status: ${task.status})`);
    }
    task.status = TaskStatus.Paid;
    task.paymentTx = txHash;
    task.updatedAt = Date.now();
    return task;
  }

  /** Internal: get task or throw */
  private mustGet(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    return task;
  }
}

// Singleton store shared by all agents
export const taskStore = new TaskStore();
