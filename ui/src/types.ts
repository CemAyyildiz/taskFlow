// ─── Task Types (mirrors shared/types.ts) ───────────────────────────
export enum TaskStatus {
  Open = "OPEN",
  Accepted = "ACCEPTED",
  Completed = "COMPLETED",
  Confirmed = "CONFIRMED",
  Paid = "PAID",
}

export interface Task {
  id: string;
  title: string;
  reward: string;
  status: TaskStatus;
  requester: string;
  worker: string | null;
  paymentTx: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Agent Types ────────────────────────────────────────────────────
export interface AgentInfo {
  name: string;
  role: "requester" | "worker";
  address: string;
  balance: string;
  skills: string[];
}

// ─── Event Log ──────────────────────────────────────────────────────
export interface EventLog {
  id: number;
  timestamp: string;
  agent: string;
  event: string;
  detail: string;
  type: "info" | "success" | "warning" | "payment";
}

// ─── Demo Step ──────────────────────────────────────────────────────
export interface DemoStep {
  id: number;
  label: string;
  description: string;
  agent: "requester" | "worker";
  skill: string;
  status: "pending" | "running" | "done";
}
