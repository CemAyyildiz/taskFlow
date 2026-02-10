import { useState, useCallback } from "react";
import {
  type Task,
  type EventLog,
  type DemoStep,
  type AgentInfo,
  TaskStatus,
} from "./types";
import {
  mockRequester,
  mockWorker,
  initialDemoSteps,
  REQUESTER_ADDRESS,
  WORKER_ADDRESS,
  MOCK_TX_HASH,
} from "./mockData";

// ─── Simulated delay (makes it feel like real agent execution) ──────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useDemoStore() {
  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<DemoStep[]>(initialDemoSteps);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [requester, setRequester] = useState<AgentInfo>(mockRequester);
  const [worker, setWorker] = useState<AgentInfo>(mockWorker);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  let eventCounter = events.length;

  const addEvent = useCallback(
    (agent: string, event: string, detail: string, type: EventLog["type"] = "info") => {
      const ts = new Date().toISOString().slice(11, 19);
      setEvents((prev) => [
        ...prev,
        { id: ++eventCounter, timestamp: ts, agent, event, detail, type },
      ]);
    },
    []
  );

  const updateStep = useCallback((id: number, status: DemoStep["status"]) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  // ── Run the full demo step by step ──────────────────────────────
  const runNextStep = useCallback(async () => {
    const nextIdx = currentStep;
    if (nextIdx >= initialDemoSteps.length || isRunning) return;

    setIsRunning(true);
    const stepId = nextIdx + 1;
    updateStep(stepId, "running");

    switch (stepId) {
      // STEP 1: Create task
      case 1: {
        addEvent("RequesterAgent", "skill:execute", 'Executing create_task("Write a smart contract audit report", "0.01")', "info");
        await delay(800);
        const newTask: Task = {
          id: "a1b2c3d4",
          title: "Write a smart contract audit report",
          reward: "0.01",
          status: TaskStatus.Open,
          requester: REQUESTER_ADDRESS,
          worker: null,
          paymentTx: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setTask(newTask);
        addEvent("RequesterAgent", "task:created", `Task "${newTask.title}" created (ID: ${newTask.id}) — Reward: ${newTask.reward} MON`, "success");
        break;
      }

      // STEP 2: Accept task
      case 2: {
        addEvent("WorkerAgent", "skill:execute", "Executing accept_task(a1b2c3d4)", "info");
        await delay(600);
        setTask((prev) =>
          prev ? { ...prev, status: TaskStatus.Accepted, worker: WORKER_ADDRESS, updatedAt: Date.now() } : prev
        );
        addEvent("WorkerAgent", "task:accepted", "Task accepted by WorkerAgent", "success");
        break;
      }

      // STEP 3: Complete task
      case 3: {
        addEvent("WorkerAgent", "skill:execute", "Executing complete_task(a1b2c3d4)", "info");
        await delay(600);
        setTask((prev) =>
          prev ? { ...prev, status: TaskStatus.Completed, updatedAt: Date.now() } : prev
        );
        addEvent("WorkerAgent", "task:completed", "Task marked as completed", "success");
        break;
      }

      // STEP 4: Confirm & pay
      case 4: {
        addEvent("RequesterAgent", "skill:execute", "Executing confirm_completion(a1b2c3d4)", "info");
        await delay(500);
        setTask((prev) =>
          prev ? { ...prev, status: TaskStatus.Confirmed, updatedAt: Date.now() } : prev
        );
        addEvent("RequesterAgent", "task:confirmed", "Task completion confirmed", "success");

        await delay(400);
        addEvent("RequesterAgent", "payment:sending", `Sending 0.01 MON → ${WORKER_ADDRESS.slice(0, 10)}...`, "warning");

        await delay(1200);
        setTask((prev) =>
          prev ? { ...prev, status: TaskStatus.Paid, paymentTx: MOCK_TX_HASH, updatedAt: Date.now() } : prev
        );
        setRequester((prev) => ({ ...prev, balance: "4.81" }));
        setWorker((prev) => ({ ...prev, balance: "1.26" }));
        addEvent("RequesterAgent", "payment:sent", `✅ 0.01 MON sent! Tx: ${MOCK_TX_HASH.slice(0, 18)}...`, "payment");
        setIsDone(true);
        break;
      }
    }

    updateStep(stepId, "done");
    setCurrentStep(nextIdx + 1);
    setIsRunning(false);
  }, [currentStep, isRunning, addEvent, updateStep]);

  // ── Reset everything ────────────────────────────────────────────
  const reset = useCallback(() => {
    setTask(null);
    setSteps(initialDemoSteps);
    setEvents([]);
    setRequester(mockRequester);
    setWorker(mockWorker);
    setCurrentStep(0);
    setIsRunning(false);
    setIsDone(false);
  }, []);

  return {
    task,
    steps,
    events,
    requester,
    worker,
    currentStep,
    isRunning,
    isDone,
    runNextStep,
    reset,
  };
}
