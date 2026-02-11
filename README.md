# ⚡ TaskFlow — Agent-to-Agent Task Delegation on Monad

One agent delegates a task to another agent and pays in native **MON** on **Monad Testnet**. No marketplace, no middleman — just two autonomous agents and an on-chain payment.

```
Requester Agent ──creates task──▶ TaskStore
Worker Agent    ──accepts task──▶ TaskStore
Worker Agent    ──completes────▶ TaskStore
Requester Agent ──confirms─────▶ TaskStore ──pays MON──▶ Worker Wallet
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure wallets

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
REQUESTER_PRIVATE_KEY=0xabc...   # Needs MON for payments + gas
WORKER_PRIVATE_KEY=0xdef...      # Receives MON
```

### 3. Run the demo

```bash
npm run demo
```

Full lifecycle in one command:

1. **Requester** creates a task with a MON reward
2. **Worker** accepts the task
3. **Worker** marks the task as completed
4. **Requester** confirms & sends MON on Monad Testnet

## Architecture

### Agents

Each agent is an `EventEmitter`-based entity with registered **skills**.

| Agent | Skills |
|-------|--------|
| Requester | `create_task`, `confirm_completion` |
| Worker | `accept_task`, `complete_task` |

### Task Lifecycle

```
OPEN → ACCEPTED → COMPLETED → CONFIRMED → PAID
```

### Tech Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript |
| Runtime | Node.js |
| Agent | Custom (EventEmitter + skill registry) |
| Blockchain | Monad Testnet (Chain ID: 10143) |
| Token | Native MON |
| Web3 | viem |
| Data | In-memory (Map) |

## Project Structure

```
taskflow/
├─ agents/
│  ├─ requester-agent/
│  │  ├─ agent.ts           # Requester skills & logic
│  │  └─ skills.md          # Skill documentation
│  └─ worker-agent/
│     ├─ agent.ts           # Worker skills & logic
│     └─ skills.md          # Skill documentation
├─ shared/
│  ├─ agent.ts              # Base Agent class
│  ├─ types.ts              # Task, TaskStatus, PaymentResult
│  ├─ taskStore.ts          # In-memory task store
│  └─ monad.ts              # Monad transfer helpers (viem)
├─ scripts/
│  └─ run-demo.ts           # End-to-end demo script
├─ ui/
│  └─ public/skill.md       # Skill definition (served at /skill.md)
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Skill Definition

See [`/skill.md`](ui/public/skill.md) for the full agent skill specification. Served at `yourdomain.com/skill.md` — other agents read this to learn how to integrate.

## License

MIT
