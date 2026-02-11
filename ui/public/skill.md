# TaskFlow Skill (Agent-to-Agent Task Delegation on Monad)

**taskflow@0.1.0** — Agent delegates work to another agent and pays in native MON on Monad Testnet.

**Key config:**
- `MONAD_RPC_URL`: `https://testnet-rpc.monad.xyz` (Monad Testnet, Chain ID 10143)
- `REQUESTER_PRIVATE_KEY`: Wallet that creates tasks & pays MON
- `WORKER_PRIVATE_KEY`: Wallet that accepts tasks & receives MON

---

## 1. Skills checklist

| Agent | Skill | Action |
|-------|-------|--------|
| Requester | `create_task` | `agent.executeSkill("create_task", title, rewardMON)` → task created, status=OPEN |
| Worker | `accept_task` | `agent.executeSkill("accept_task", taskId)` → task accepted, status=ACCEPTED |
| Worker | `complete_task` | `agent.executeSkill("complete_task", taskId)` → task completed, status=COMPLETED |
| Requester | `confirm_completion` | `agent.executeSkill("confirm_completion", taskId)` → confirmed + MON sent, status=PAID |

---

## 2. When to use

- User or agent wants to **delegate a task** to another agent
- User or agent wants to **pay for completed work** in MON
- User wants to run an autonomous **task→accept→complete→pay** flow
- User mentions "TaskFlow", "agent delegation", "pay agent in MON"

---

## 3. Prerequisites

- **Node.js ≥ 18** and **tsx** for TypeScript execution
- Two funded wallets on Monad Testnet (Requester needs MON for payments + gas)
- Env vars: `REQUESTER_PRIVATE_KEY`, `WORKER_PRIVATE_KEY`, optionally `MONAD_RPC_URL`
- Dependencies: `viem` (web3), `dotenv` (env loading)

---

## 4. Core concepts

### Agent class

Each agent extends Node.js `EventEmitter` with a skill registry. Skills are named async functions that an agent can execute.

```ts
import { Agent } from "./shared/agent.js";

const agent = new Agent("MyAgent", walletAddress);
agent.registerSkill("my_skill", "Description", async (...args) => { /* logic */ });
await agent.executeSkill("my_skill", arg1, arg2);
```

### Task lifecycle (FSM)

```
OPEN → ACCEPTED → COMPLETED → CONFIRMED → PAID
```

| Status | Meaning |
|--------|---------|
| `OPEN` | Task created, waiting for a worker |
| `ACCEPTED` | Worker claimed the task |
| `COMPLETED` | Worker finished the work |
| `CONFIRMED` | Requester verified the output |
| `PAID` | MON transferred to worker on-chain |

### Events (pub/sub)

Agents communicate via typed events. The worker subscribes to the requester's events and vice versa.

| Event | Emitted by | Payload |
|-------|-----------|---------|
| `task:created` | Requester | `{ taskId, title, reward }` |
| `task:accepted` | Worker | `{ taskId, worker }` |
| `task:completed` | Worker | `{ taskId, worker }` |
| `task:confirmed` | Requester | `{ taskId }` |
| `payment:sent` | Requester | `{ taskId, txHash, amount, to }` |
| `payment:received` | Worker | `{ taskId, txHash, amount }` |

### TaskStore

Singleton in-memory `Map<string, Task>`. Methods: `create`, `get`, `list`, `accept`, `complete`, `confirm`, `markPaid`.

### Monad payment

Native MON transfer via `viem`:

```ts
import { sendMON } from "./shared/monad.js";

const result = await sendMON(senderPrivateKey, recipientAddress, "0.01");
// result: { txHash, from, to, amount }
```

- Chain: Monad Testnet (Chain ID 10143, ~400ms blocks)
- Gas: 21,000 (simple native transfer)
- Explorer: `https://testnet.monadscan.com/tx/{hash}`

---

## 5. Workflow (copy this checklist)

- [ ] Load env vars (`REQUESTER_PRIVATE_KEY`, `WORKER_PRIVATE_KEY`)
- [ ] Derive wallet addresses via `addressFromKey(privateKey)`
- [ ] Create agents: `createRequesterAgent(address, privateKey)`, `createWorkerAgent(address)`
- [ ] Wire event subscriptions (worker listens to requester, requester listens to worker)
- [ ] **Step 1:** Requester → `create_task(title, reward)` → emits `task:created`
- [ ] **Step 2:** Worker → `accept_task(taskId)` → emits `task:accepted`
- [ ] **Step 3:** Worker → `complete_task(taskId)` → emits `task:completed`
- [ ] **Step 4:** Requester → `confirm_completion(taskId)` → sends MON → emits `payment:sent`
- [ ] Verify final task status is `PAID` with a valid tx hash

---

## 6. Core steps

### §1 Create agents

```ts
import "dotenv/config";
import type { Hex } from "viem";
import { createRequesterAgent } from "./agents/requester-agent/agent.js";
import { createWorkerAgent } from "./agents/worker-agent/agent.js";
import { addressFromKey } from "./shared/monad.js";

const requesterKey = process.env.REQUESTER_PRIVATE_KEY as Hex;
const workerKey = process.env.WORKER_PRIVATE_KEY as Hex;

const requester = createRequesterAgent(addressFromKey(requesterKey), requesterKey);
const worker = createWorkerAgent(addressFromKey(workerKey));
```

### §2 Wire event subscriptions

```ts
// Worker auto-listens for new tasks
worker.subscribe(requester, "task:created", (event) => {
  console.log(`New task available: ${event.title} (${event.reward} MON)`);
});

// Requester auto-listens for task completion
requester.subscribe(worker, "task:completed", (event) => {
  console.log(`Task ${event.taskId} completed, ready to confirm`);
});

// Worker listens for payment
worker.subscribe(requester, "payment:sent", (event) => {
  console.log(`Payment received: ${event.amount} MON (tx: ${event.txHash})`);
});
```

### §3 Execute the full task lifecycle

```ts
// 1. Requester creates a task
const task = await requester.executeSkill("create_task", "Smart contract audit", "0.01");

// 2. Worker accepts the task
await worker.executeSkill("accept_task", task.id);

// 3. Worker completes the task
await worker.executeSkill("complete_task", task.id);

// 4. Requester confirms & pays (MON sent on-chain)
const payment = await requester.executeSkill("confirm_completion", task.id);
console.log(`Paid: ${payment.txHash}`);
```

---

## 7. Events reference

| Event | When | Action |
|-------|------|--------|
| `task:created` | After `create_task` succeeds | Worker should evaluate and potentially `accept_task` |
| `task:accepted` | After `accept_task` succeeds | Requester is notified work has begun |
| `task:completed` | After `complete_task` succeeds | Requester should `confirm_completion` |
| `task:confirmed` | After confirm, before payment | Internal, payment follows immediately |
| `payment:sent` | After on-chain MON transfer confirms | Worker receives payment notification |

---

## 8. API reference

### Agent class methods

| Method | Description |
|--------|-------------|
| `registerSkill(name, description, fn)` | Register a named skill function |
| `executeSkill(name, ...args)` | Execute a skill by name |
| `listSkills()` | List all registered skills |
| `emitEvent(event, payload)` | Emit a typed agent event |
| `subscribe(otherAgent, event, handler)` | Subscribe to another agent's events |
| `log(message)` | Timestamped console log |

### Requester skills

| Skill | Params | Returns |
|-------|--------|---------|
| `create_task` | `(title: string, reward: string)` | `Task` object |
| `confirm_completion` | `(taskId: string)` | `PaymentResult { txHash, from, to, amount }` |

### Worker skills

| Skill | Params | Returns |
|-------|--------|---------|
| `accept_task` | `(taskId: string)` | `Task` object |
| `complete_task` | `(taskId: string)` | `Task` object |

### Monad helpers

| Function | Description |
|----------|-------------|
| `sendMON(senderKey, recipientAddr, amountMON)` | Send native MON, returns `PaymentResult` |
| `getBalance(address)` | Returns MON balance as string |
| `addressFromKey(privateKey)` | Derive address from private key |
| `getPublicClient()` | viem public client for reads |
| `getWalletClient(privateKey)` | viem wallet client for txs |

---

## 9. Important rules

1. **Requester pays** — only the requester agent holds the private key used for MON transfers
2. **Status FSM is strict** — tasks must follow OPEN→ACCEPTED→COMPLETED→CONFIRMED→PAID in order
3. **Only the assigned worker** can `complete_task` — enforced by TaskStore
4. **Only the requester** can `confirm_completion` — enforced by TaskStore
5. **Events are synchronous** — `EventEmitter.emit()` is sync; payment itself is async
6. **Gas is fixed at 21,000** — native MON transfers only, no contract calls
7. **Private keys** must start with `0x` prefix for viem compatibility

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Missing environment variable` | Copy `.env.example` → `.env`, fill in both private keys |
| `Task is not open` | Task was already accepted; check `taskStore.get(id).status` |
| `Only the assigned worker can complete` | Wrong agent calling `complete_task`; use the worker that accepted |
| `Transaction reverted` | Requester wallet has insufficient MON for reward + gas |
| `Skill not found` | Skill name typo; call `agent.listSkills()` to see registered skills |
| `Cannot find module` | Run `npm install` first; ensure `"type": "module"` in package.json |
| Balance not updating | Monad Testnet ~400ms finality; wait and re-query `getBalance()` |

---

## 11. File locations

| Path | Description |
|------|-------------|
| `shared/agent.ts` | Base Agent class (EventEmitter + skill registry) |
| `shared/types.ts` | Task, TaskStatus, PaymentResult types |
| `shared/taskStore.ts` | In-memory task store singleton |
| `shared/monad.ts` | Monad Testnet transfer helpers (viem) |
| `agents/requester-agent/agent.ts` | Requester agent factory + skills |
| `agents/worker-agent/agent.ts` | Worker agent factory + skills |
| `scripts/run-demo.ts` | Full lifecycle demo script |
| `.env.example` | Environment variable template |

---

## 12. Minimal example

```ts
import "dotenv/config";
import type { Hex } from "viem";
import { createRequesterAgent } from "./agents/requester-agent/agent.js";
import { createWorkerAgent } from "./agents/worker-agent/agent.js";
import { addressFromKey } from "./shared/monad.js";

const rKey = process.env.REQUESTER_PRIVATE_KEY as Hex;
const wKey = process.env.WORKER_PRIVATE_KEY as Hex;

const requester = createRequesterAgent(addressFromKey(rKey), rKey);
const worker = createWorkerAgent(addressFromKey(wKey));

// Wire events
worker.subscribe(requester, "task:created", (e) => console.log("New task:", e.title));
worker.subscribe(requester, "payment:sent", (e) => console.log("Paid!", e.txHash));

// Run the lifecycle
const task = await requester.executeSkill("create_task", "Audit my contract", "0.01");
await worker.executeSkill("accept_task", task.id);
await worker.executeSkill("complete_task", task.id);
await requester.executeSkill("confirm_completion", task.id);
// → MON transferred on Monad Testnet, task status: PAID
```
