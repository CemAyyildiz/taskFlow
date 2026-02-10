# 🏪 Agent Marketplace — Ultra-Simple MVP

A minimal hackathon prototype where **two autonomous agents** collaborate through a task lifecycle and settle payments with native **MON tokens** on **Monad Testnet**.

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

Copy the example env file and add your **Monad Testnet** private keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
REQUESTER_PRIVATE_KEY=0xabc...   # Requester wallet (needs MON for payments + gas)
WORKER_PRIVATE_KEY=0xdef...      # Worker wallet
```

> 💧 **Faucet:** Get testnet MON at [faucet.monad.xyz](https://faucet.monad.xyz)

### 3. Run the demo

```bash
npm run demo
```

This executes the full lifecycle in a single command:

1. **Requester** creates a task with a MON reward
2. **Worker** accepts the task
3. **Worker** marks the task as completed
4. **Requester** confirms completion
5. **Requester** sends MON to the worker on Monad Testnet

## Architecture

### Agents

Each agent is an `EventEmitter`-based entity that registers **skills** (named functions) and communicates via events.

| Agent            | Skills                              |
|------------------|-------------------------------------|
| RequesterAgent   | `create_task`, `confirm_completion` |
| WorkerAgent      | `accept_task`, `complete_task`      |

### Task Lifecycle

```
OPEN → ACCEPTED → COMPLETED → CONFIRMED → PAID
```

### Tech Stack

| Component        | Choice                                |
|------------------|---------------------------------------|
| Language         | TypeScript                            |
| Runtime          | Node.js                               |
| Agent Framework  | Lightweight custom (EventEmitter)     |
| Blockchain       | Monad Testnet (Chain ID: 10143)       |
| Token            | Native MON                            |
| Web3 Library     | viem                                  |
| Data Storage     | In-memory (Map)                       |

## Project Structure

```
agent-marketplace/
├─ agents/
│  ├─ requester-agent/
│  │  ├─ agent.ts          # Requester skills & logic
│  │  └─ skills.md         # Skill documentation
│  └─ worker-agent/
│     ├─ agent.ts          # Worker skills & logic
│     └─ skills.md         # Skill documentation
├─ shared/
│  ├─ agent.ts             # Base Agent class (EventEmitter + skills)
│  ├─ types.ts             # Task, TaskStatus, PaymentResult
│  ├─ taskStore.ts         # In-memory task store (singleton)
│  └─ monad.ts             # Monad Testnet transfer helpers (viem)
├─ scripts/
│  └─ run-demo.ts          # End-to-end demo script
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

## License

MIT
