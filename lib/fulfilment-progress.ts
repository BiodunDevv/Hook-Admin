/** Fulfilment task progress by age, not deadlines, replacing the old hardcoded SLA timers; there's no "Completed" step since it's never written. */

export type CheckpointState = "done" | "current" | "upcoming" | "halted";

export interface TaskCheckpoint {
  key: string;
  title: string;
  state: CheckpointState;
  /** When it actually happened, for `done`. */
  at?: string;
}

interface TaskLike {
  status?: string;
  createdAt?: string;
  acceptedAt?: string;
  sourcingStartedAt?: string;
  productSecuredAt?: string;
  hubReceivedAt?: string;
}

/** Ordered stages a task passes through. Index = how far it has progressed. */
const STAGE_ORDER = [
  "UNASSIGNED",
  "ALERTED",
  "ACCEPTED",
  "SOURCING",
  "PRODUCT_SECURED",
  "PACKING",
  "READY_FOR_HUB",
  "HUB_RECEIVED",
  "QC_PASSED",
];

const TERMINAL = new Set(["HUB_RECEIVED", "QC_PASSED"]);

export function isTaskFinished(status?: string) {
  return TERMINAL.has(String(status));
}

export function isTaskHalted(status?: string) {
  return String(status) === "BLOCKED" || String(status) === "QC_FAILED";
}

export function buildCheckpoints(task: TaskLike): TaskCheckpoint[] {
  const stageIndex = STAGE_ORDER.indexOf(String(task.status));
  const halted = isTaskHalted(task.status);
  const finished = isTaskFinished(task.status);

  const rows: Array<[string, string, string | undefined, number]> = [
    ["accepted", "Accepted", task.acceptedAt, STAGE_ORDER.indexOf("ACCEPTED")],
    ["sourcing", "Sourcing started", task.sourcingStartedAt, STAGE_ORDER.indexOf("SOURCING")],
    ["secured", "Product secured", task.productSecuredAt, STAGE_ORDER.indexOf("PRODUCT_SECURED")],
    ["handover", "Hub handover", task.hubReceivedAt, STAGE_ORDER.indexOf("HUB_RECEIVED")],
  ];

  let currentAssigned = false;

  return rows.map(([key, title, at, reachedAt]) => {
    // A timestamp proves a stage was reached; otherwise a later status implies the earlier ones happened.
    const reached = Boolean(at) || finished || (stageIndex >= 0 && stageIndex > reachedAt);
    if (reached) return { key, title, state: "done" as const, at };

    if (!currentAssigned) {
      currentAssigned = true;
      return { key, title, state: halted ? ("halted" as const) : ("current" as const) };
    }
    return { key, title, state: "upcoming" as const };
  });
}

/** How long the task has been open, e.g. "Waiting 3h". */
export function taskAge(createdAt?: string, now = Date.now()) {
  if (!createdAt) return undefined;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return undefined;
  const minutes = Math.max(Math.round((now - created) / 60000), 0);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `Waiting ${minutes}m`;
  if (minutes < 60 * 24) return `Waiting ${Math.round(minutes / 60)}h`;
  return `Waiting ${Math.round(minutes / (60 * 24))}d`;
}
