import { MongoClient, Db, GridFSBucket, type Document } from "mongodb";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dbName = process.env.MONGODB_DB_NAME || "bni_event";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getRegistrationsCollection() {
  const db = await getDb();
  return db.collection<RegistrationDoc>("registrations");
}

export async function getCountersCollection() {
  const db = await getDb();
  return db.collection<CounterDoc>("counters");
}

export async function getAuditLogsCollection() {
  const db = await getDb();
  return db.collection<AuditLogDoc>("registration_audit_logs");
}

export async function getPaymentProofsBucket(): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "payment_proofs" });
}

export async function ensureIndexes(): Promise<void> {
  const registrations = await getRegistrationsCollection();
  await registrations.createIndexes([
    { key: { registration_id: 1 }, unique: true },
    { key: { created_at: -1 } },
    { key: { payment_status: 1 } },
    { key: { chapter: 1 } },
    { key: { phone: 1 } },
  ]);
}

export interface RegistrationDoc {
  registration_id: string;
  name: string;
  phone: string;
  email: string;
  membership_type: string;
  region: string;
  chapter: string;
  district: string | null;
  referred_by: string | null;
  category: string;
  member_count: number;
  amount: number;
  consent_accepted: boolean;
  payment_status: string;
  payment_reference: string | null;
  payment_screenshot_url: string | null;
  payment_screenshot_file_id: string | null;
  razorpay_payment_link_id: string | null;
  razorpay_payment_link_url: string | null;
  razorpay_payment_link_status: string | null;
  razorpay_payment_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CounterDoc extends Document {
  _id: string;
  last_value: number;
}

export interface AuditLogDoc {
  registration_id: string;
  action: string;
  actor: string;
  details?: Record<string, unknown> | null;
  created_at: Date;
}
