import Dexie, { type Table } from "dexie";

export interface QueuedMutation {
  id?: number;
  type: "farmer.create" | "farm.create" | "farm.attachPolygon";
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

class HerbQueue extends Dexie {
  mutations!: Table<QueuedMutation, number>;

  constructor() {
    super("herb-sync");
    this.version(1).stores({ mutations: "++id, type, createdAt" });
  }
}

export const queueDb = new HerbQueue();

export async function enqueue(type: QueuedMutation["type"], payload: unknown): Promise<number> {
  return queueDb.mutations.add({ type, payload, createdAt: Date.now(), attempts: 0 });
}

export async function markAttempted(id: number, error?: string): Promise<void> {
  await queueDb.mutations
    .where("id")
    .equals(id)
    .modify((row: QueuedMutation) => {
      row.attempts += 1;
      if (error) row.lastError = error;
    });
}

export async function dequeue(id: number): Promise<void> {
  await queueDb.mutations.delete(id);
}

export async function pendingCount(): Promise<number> {
  return queueDb.mutations.count();
}
