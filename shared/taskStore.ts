import { Task, TaskStatus } from "./types.js";
import { randomUUID } from "node:crypto";

// ─── In-Memory Task Store (Marketplace) ─────────────────────────────
class TaskStore {
  private tasks: Map<string, Task> = new Map();

  /** Requester creates a task after paying escrow to platform */
  create(opts: {
    title: string;
    description: string;
    reward: string;
    requester: string;
    escrowTx: string;
    escrowVerified: boolean;
  }): Task {
    const task: Task = {
      id: randomUUID().slice(0, 8),
      title: opts.title,
      description: opts.description,
      reward: opts.reward,
      status: TaskStatus.Open,
      requester: opts.requester,
      worker: null,
      escrowTx: opts.escrowTx,
      escrowVerified: opts.escrowVerified,
      payoutTx: null,
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  list(status?: TaskStatus): Task[] {
    const all = [...this.tasks.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }

  /** Worker agent accepts an open task */
  accept(taskId: string, workerAddress: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Open) {
      throw new Error(`Task ${taskId} is not OPEN (status: ${task.status})`);
    }
    if (task.requester.toLowerCase() === workerAddress.toLowerCase()) {
      throw new Error("Requester cannot accept their own task");
    }
    task.status = TaskStatus.Accepted;
    task.worker = workerAddress;
    task.updatedAt = Date.now();
    return task;
  }

  /** Worker agent submits result */
  submit(taskId: string, workerAddress: string, result: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Accepted) {
      throw new Error(`Task ${taskId} is not ACCEPTED (status: ${task.status})`);
    }
    if (task.worker?.toLowerCase() !== workerAddress.toLowerCase()) {
      throw new Error("Only the assigned worker can submit results");
    }
    task.status = TaskStatus.Submitted;
    task.result = result;
    task.updatedAt = Date.now();
    return task;
  }

  /** Platform verifies and releases payment → DONE */
  complete(taskId: string, payoutTx: string): Task {
    const task = this.mustGet(taskId);
    if (task.status !== TaskStatus.Submitted) {
      throw new Error(`Task ${taskId} is not SUBMITTED (status: ${task.status})`);
    }
    task.status = TaskStatus.Done;
    task.payoutTx = payoutTx;
    task.updatedAt = Date.now();
    return task;
  }

  private mustGet(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    return task;
  }
}

export const taskStore = new TaskStore();
