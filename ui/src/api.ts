// ─── TaskFlow Agent API Client ──────────────────────────────────────
// Connects to the real TaskFlow agent server.

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:3001";

// ─── Response Types ─────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  agent: string;
  version: string;
  wallet: string;
  uptime: number;
  tasks: number;
}

export interface TaskResponse {
  id: string;
  title: string;
  reward: string;
  status: string;
  requester: string;
  worker: string | null;
  paymentTx: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── API Calls ──────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${AGENT_URL}/health`);
  if (!res.ok) throw new Error("Agent unreachable");
  return res.json();
}

export async function getTasks(status?: string): Promise<TaskResponse[]> {
  const url = status ? `${AGENT_URL}/tasks?status=${status}` : `${AGENT_URL}/tasks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  title: string,
  reward: string,
  requester: string
): Promise<TaskResponse> {
  const res = await fetch(`${AGENT_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, reward, requester }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create task" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function acceptTask(
  id: string,
  worker: string
): Promise<TaskResponse> {
  const res = await fetch(`${AGENT_URL}/tasks/${id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to accept task" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function completeTask(
  id: string,
  worker: string
): Promise<TaskResponse> {
  const res = await fetch(`${AGENT_URL}/tasks/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to complete task" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function confirmTask(
  id: string,
  requester: string
): Promise<TaskResponse> {
  const res = await fetch(`${AGENT_URL}/tasks/${id}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requester }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to confirm task" }));
    throw new Error(err.error);
  }
  return res.json();
}

// ─── SSE Stream ─────────────────────────────────────────────────────

export function connectSSE(
  onEvent: (event: string, data: unknown) => void
): EventSource {
  const es = new EventSource(`${AGENT_URL}/events`);

  const events = [
    "connected",
    "task:created",
    "task:accepted",
    "task:completed",
    "task:confirmed",
    "payment:sent",
    "payment:failed",
    "monitor:stale_task",
    "monitor:awaiting_confirm",
  ];

  for (const evt of events) {
    es.addEventListener(evt, (e) => {
      try {
        onEvent(evt, JSON.parse((e as MessageEvent).data));
      } catch {
        onEvent(evt, (e as MessageEvent).data);
      }
    });
  }

  return es;
}
