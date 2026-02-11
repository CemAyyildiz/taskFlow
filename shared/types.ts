// ─── Task Status ────────────────────────────────────────────────────
// Marketplace lifecycle: OPEN → ACCEPTED → SUBMITTED → DONE
export enum TaskStatus {
  /** Task created, escrow deposited by requester. Waiting for a worker. */
  Open = "OPEN",
  /** A worker agent has accepted the task. Work in progress. */
  Accepted = "ACCEPTED",
  /** Worker submitted a result. Platform is verifying. */
  Submitted = "SUBMITTED",
  /** Platform verified, payment released to worker. Complete. */
  Done = "DONE",
}

// ─── Task ───────────────────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  description: string;
  /** Reward amount in MON */
  reward: string;
  status: TaskStatus;

  /** Wallet address of the requester agent (creates task, pays escrow) */
  requester: string;
  /** Wallet address of the worker agent (accepts task, does work) */
  worker: string | null;

  /** Tx hash of the escrow payment: requester → platform wallet */
  escrowTx: string;
  /** Whether escrow was verified on-chain */
  escrowVerified: boolean;

  /** Tx hash of the payout: platform wallet → worker */
  payoutTx: string | null;

  /** Result submitted by the worker agent */
  result: string | null;

  createdAt: number;
  updatedAt: number;
}

// ─── Payment Result (for sendMON) ───────────────────────────────────
export interface PaymentResult {
  txHash: string;
  from: string;
  to: string;
  amount: string;
}
