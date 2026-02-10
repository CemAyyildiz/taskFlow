# Worker Agent — Skills

## accept_task

**Description:** Accept an open task from the marketplace.

**Parameters:**
| Name    | Type   | Description              |
|---------|--------|--------------------------|
| taskId  | string | The ID of the task       |

**Behavior:**
1. Validates task status is `OPEN`.
2. Assigns self as the worker.
3. Updates task status to `ACCEPTED`.
4. Emits `task:accepted` event with `{ taskId, worker }`.

---

## complete_task

**Description:** Mark an accepted task as completed (simulated — no real work verification).

**Parameters:**
| Name    | Type   | Description              |
|---------|--------|--------------------------|
| taskId  | string | The ID of the task       |

**Behavior:**
1. Validates task status is `ACCEPTED` and caller is the assigned worker.
2. Updates task status to `COMPLETED`.
3. Emits `task:completed` event with `{ taskId, worker }`.
