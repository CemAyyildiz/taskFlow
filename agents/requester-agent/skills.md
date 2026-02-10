# Requester Agent — Skills

## create_task

**Description:** Create a new task with a title and MON reward.

**Parameters:**
| Name    | Type   | Description                          |
|---------|--------|--------------------------------------|
| title   | string | Short description of the task        |
| reward  | string | Reward amount in MON (e.g. "0.01")   |

**Behavior:**
1. Creates a task entry in the shared TaskStore with status `OPEN`.
2. Emits `task:created` event with `{ taskId, title, reward }`.

---

## confirm_completion

**Description:** Confirm that a completed task is satisfactory, then send MON payment to the worker.

**Parameters:**
| Name    | Type   | Description              |
|---------|--------|--------------------------|
| taskId  | string | The ID of the task       |

**Behavior:**
1. Validates task status is `COMPLETED` and caller is the requester.
2. Updates task status to `CONFIRMED`.
3. Sends `reward` amount of native MON to the worker's wallet via Monad Testnet.
4. Updates task status to `PAID` with the transaction hash.
5. Emits `task:confirmed` and `payment:sent` events.
