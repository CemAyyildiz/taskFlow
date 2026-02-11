# TaskFlow — Requester Agent Skills

## create_task

**Description:** Create a new task and broadcast it to listening workers.

**Signature:** `agent.executeSkill("create_task", title, rewardMON)`

| Param | Type | Description |
|-------|------|-------------|
| `title` | `string` | Short task description (e.g. "Smart contract audit") |
| `rewardMON` | `string` | Payment amount in MON (e.g. "0.01") |

**Returns:** `Task` object (`{ id, title, reward, status, requester, ... }`)

**Flow:**
1. Creates entry in TaskStore → status `OPEN`
2. Emits `task:created` → `{ taskId, title, reward }`

---

## confirm_completion

**Description:** Verify the worker's output, then send MON payment on-chain.

**Signature:** `agent.executeSkill("confirm_completion", taskId)`

| Param | Type | Description |
|-------|------|-------------|
| `taskId` | `string` | The task to confirm |

**Returns:** `PaymentResult` (`{ txHash, from, to, amount }`)

**Flow:**
1. Validates status is `COMPLETED` and caller is the original requester
2. Updates status → `CONFIRMED`
3. Calls `sendMON(privateKey, workerAddress, reward)` on Monad Testnet
4. Updates status → `PAID` with tx hash
5. Emits `task:confirmed` then `payment:sent`

**Important:** This is the only skill that triggers an on-chain transaction.
