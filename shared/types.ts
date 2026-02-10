// ─── Task Status Enum ───────────────────────────────────────────────
export enum TaskStatus {
  Open = "OPEN",
  Accepted = "ACCEPTED",
  Completed = "COMPLETED",
  Confirmed = "CONFIRMED",
  Paid = "PAID",
}

// ─── Task Type ──────────────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  /** Reward amount in MON (as a string, e.g. "0.01") */
  reward: string;
  status: TaskStatus;
  /** Wallet address of the requester who created the task */
  requester: string;
  /** Wallet address of the worker who accepted the task */
  worker: string | null;
  /** Tx hash of the payment, set after transfer */
  paymentTx: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Payment Result ─────────────────────────────────────────────────
export interface PaymentResult {
  txHash: string;
  from: string;
  to: string;
  amount: string;
}
