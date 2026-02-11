// ─── Task Types (mirrors shared/types.ts) ───────────────────────────
export const TaskStatus = {
  Open: "OPEN",
  Accepted: "ACCEPTED",
  Completed: "COMPLETED",
  Confirmed: "CONFIRMED",
  Paid: "PAID",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

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
