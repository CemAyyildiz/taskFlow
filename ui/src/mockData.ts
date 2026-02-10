import type { AgentInfo, DemoStep } from "./types";

// ─── Mock Wallets ───────────────────────────────────────────────────
export const REQUESTER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
export const WORKER_ADDRESS = "0x8Ba1f109551bD432803012645Ac136ddd64DBA72";

export const MOCK_TX_HASH =
  "0x3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b";

// ─── Mock Agents ────────────────────────────────────────────────────
export const mockRequester: AgentInfo = {
  name: "RequesterAgent",
  role: "requester",
  address: REQUESTER_ADDRESS,
  balance: "4.82",
  skills: ["create_task", "confirm_completion"],
};

export const mockWorker: AgentInfo = {
  name: "WorkerAgent",
  role: "worker",
  address: WORKER_ADDRESS,
  balance: "1.25",
  skills: ["accept_task", "complete_task"],
};

// ─── Demo Steps ─────────────────────────────────────────────────────
export const initialDemoSteps: DemoStep[] = [
  {
    id: 1,
    label: "Create Task",
    description: 'RequesterAgent calls create_task("Write a smart contract audit report", "0.01")',
    agent: "requester",
    skill: "create_task",
    status: "pending",
  },
  {
    id: 2,
    label: "Accept Task",
    description: "WorkerAgent calls accept_task(taskId)",
    agent: "worker",
    skill: "accept_task",
    status: "pending",
  },
  {
    id: 3,
    label: "Complete Task",
    description: "WorkerAgent calls complete_task(taskId)",
    agent: "worker",
    skill: "complete_task",
    status: "pending",
  },
  {
    id: 4,
    label: "Confirm & Pay",
    description: "RequesterAgent calls confirm_completion(taskId) → sends 0.01 MON",
    agent: "requester",
    skill: "confirm_completion",
    status: "pending",
  },
];
