import Dexie, { type Table } from "dexie";

// ── Payload shapes ─────────────────────────────────────────────────────────

export interface FarmerCreatePayload {
  farmerCode: string;      // temp client-side code, e.g. "F-tmp-1747234567890"
  cooperativeId: string;   // Convex ID<"cooperatives">
  fullName: string;
  phone: string;
  nationalId: string;
  village: string;
  district: string;
  region: string;
}

export interface FarmCreatePayload {
  farmCode: string;           // temp client-side code, e.g. "FM-tmp-..."
  farmerCode: string;         // links to the FarmerCreatePayload.farmerCode above
  resolvedFarmerId?: string;  // filled in by drain after farmer.create succeeds
  crop: "coffee" | "avocado" | "macadamia";
  variety: string;
  estimatedAreaHa: number;
  certifications: string[];
}

export interface AttachPolygonPayload {
  farmCode: string;          // links to FarmCreatePayload.farmCode
  resolvedFarmId?: string;   // filled in by drain after farm.create succeeds
  polygonInline: Array<{ lat: number; lng: number }>;
  areaHa: number;
}

export type MutationType = "farmer.create" | "farm.create" | "farm.attachPolygon";

export type MutationPayload =
  | FarmerCreatePayload
  | FarmCreatePayload
  | AttachPolygonPayload;

export interface QueuedMutation {
  id?: number;
  type: MutationType;
  payload: MutationPayload;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

// ── Dexie database ─────────────────────────────────────────────────────────

class HerbQueue extends Dexie {
  mutations!: Table<QueuedMutation, number>;

  constructor() {
    super("herb-sync");
    this.version(1).stores({ mutations: "++id, type, createdAt" });
  }
}

export const queueDb = new HerbQueue();

// ── Helpers ────────────────────────────────────────────────────────────────

export async function enqueue(type: MutationType, payload: MutationPayload): Promise<number> {
  return queueDb.mutations.add({ type, payload, createdAt: Date.now(), attempts: 0 });
}

export async function dequeue(id: number): Promise<void> {
  await queueDb.mutations.delete(id);
}

export async function patchPayload(id: number, patch: Partial<MutationPayload>): Promise<void> {
  await queueDb.mutations
    .where("id")
    .equals(id)
    .modify((row: QueuedMutation) => {
      row.payload = { ...row.payload, ...patch } as MutationPayload;
    });
}

export async function markAttempted(id: number, error?: string): Promise<void> {
  await queueDb.mutations
    .where("id")
    .equals(id)
    .modify((row: QueuedMutation) => {
      row.attempts += 1;
      if (error !== undefined) row.lastError = error;
    });
}

export async function pendingCount(): Promise<number> {
  return queueDb.mutations.count();
}
