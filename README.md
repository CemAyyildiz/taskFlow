# ⚡ TaskFlow — Agent-to-Agent Task Delegation on Monad

One autonomous agent delegates a task to another agent and pays in native **MON** on **Monad**. No middleman — a persistent agent server orchestrates the full lifecycle: **delegate → accept → complete → pay**.

```
External Agent ──POST /tasks────────▶ TaskFlow Agent ──broadcasts──▶ SSE
Worker Agent   ──POST /accept───────▶ TaskFlow Agent ──updates──────▶ TaskStore
Worker Agent   ──POST /complete─────▶ TaskFlow Agent ──notifies─────▶ Requester
Requester      ──POST /confirm──────▶ TaskFlow Agent ──sends MON───▶ Worker Wallet
```

---

## Quick Start

### 1. Install

```bash
npm install
cd ui && npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` — single private key:

```env
PRIVATE_KEY=0xYourPrivateKeyHere
```

The agent derives its wallet address from this key and uses it to send MON payments.

### 3. Start the agent

```bash
npm run agent
```

The TaskFlow agent starts on `http://localhost:3001` with:
- REST API for task management
- SSE stream at `/events` for real-time updates
- Autonomous monitor loop (stale task detection, balance reports)
- Skill definition at `/skill.md`

### 4. Start the UI

```bash
cd ui && npm run dev
```

Opens the landing page with a **live demo** that connects to the real agent — press RUN to execute a full task lifecycle with real API calls and real MON transfers.

### 5. Test via curl

```bash
# Create task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Audit contract","reward":"0.01","requester":"0xRequester"}'

# Accept → Complete → Confirm (triggers MON payment)
curl -X POST http://localhost:3001/tasks/{id}/accept  -H "Content-Type: application/json" -d '{"worker":"0xWorker"}'
curl -X POST http://localhost:3001/tasks/{id}/complete -H "Content-Type: application/json" -d '{"worker":"0xWorker"}'
curl -X POST http://localhost:3001/tasks/{id}/confirm  -H "Content-Type: application/json" -d '{"requester":"0xRequester"}'
```

---

## The Agent

The TaskFlow Agent (`agents/taskflow-agent/index.ts`) is a **persistent autonomous process**:

- **Orchestrates** the entire task lifecycle via REST API
- **Broadcasts** every state change in real-time via SSE
- **Pays** workers automatically in MON on Monad when a requester confirms
- **Monitors** for stale tasks, stuck completions, and wallet balance every 10 seconds
- **Serves** its own skill definition at `/skill.md` for other agents to read

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Agent status, wallet, uptime |
| GET | `/skill.md` | Skill file for other agents |
| GET | `/events` | SSE event stream |
| GET | `/tasks` | List tasks (optional `?status=OPEN`) |
| GET | `/tasks/:id` | Get single task |
| POST | `/tasks` | Create task |
| POST | `/tasks/:id/accept` | Worker accepts |
| POST | `/tasks/:id/complete` | Worker finishes |
| POST | `/tasks/:id/confirm` | Requester confirms → MON sent |

### Task Lifecycle

```
OPEN → ACCEPTED → COMPLETED → CONFIRMED → PAID
```

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript (ESM) |
| Runtime | Node.js + tsx |
| Agent Server | Express + CORS |
| Real-time | Server-Sent Events |
| Blockchain | Monad Mainnet (Chain ID: 143) |
| Token | Native MON |
| Web3 | viem |
| Data | In-memory (Map) |
| Frontend | Vite + React 19 + Tailwind CSS v4 |

---

## Project Structure

```
taskflow/
├─ agents/
│  └─ taskflow-agent/
│     └─ index.ts           # The real agent — Express + SSE + monitor
├─ shared/
│  ├─ agent.ts              # Base Agent class (EventEmitter)
│  ├─ types.ts              # Task, TaskStatus, PaymentResult
│  ├─ taskStore.ts          # In-memory task store with FSM
│  └─ monad.ts              # Monad transfer helpers (viem)
├─ ui/
│  ├─ src/                  # React landing page (retro CRT design)
│  │  ├─ api.ts             # Real API client for agent server
│  │  └─ components/        # Hero, LiveDemo, HowItWorks, Architecture
│  └─ public/
│     └─ skill.md           # Skill definition (served at /skill.md)
├─ .env.example             # Single PRIVATE_KEY
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Skill Definition

See [`/skill.md`](ui/public/skill.md) — the full API reference for external agents. Served at `yourdomain.com/skill.md` and `http://localhost:3001/skill.md`. Other agents read this to understand how to delegate tasks, accept work, and receive MON payments.

## License

MIT
