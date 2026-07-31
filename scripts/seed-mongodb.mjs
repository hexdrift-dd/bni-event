/**
 * Seed sample registrations into MongoDB.
 * Usage:
 *   node --env-file=.env.local scripts/seed-mongodb.mjs
 * or set MONGODB_URI then:
 *   node scripts/seed-mongodb.mjs
 */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "bni_event";

if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const samples = [
  {
    registration_id: "BNI-AFL-0001",
    name: "Ananya Menon",
    phone: "9876543210",
    email: "ananya@example.com",
    region: "Kozhikode",
    chapter: "BNI Calicut Central",
    category: "",
    member_count: 1,
    amount: 1000,
    consent_accepted: true,
    payment_status: "registered",
    payment_reference: null,
    payment_screenshot_url: null,
    payment_screenshot_file_id: null,
    notes: "Sample single entry",
  },
  {
    registration_id: "BNI-AFL-0002",
    name: "Rahul Krishnan",
    phone: "9876501234",
    email: "rahul@example.com",
    region: "Kannur",
    chapter: "BNI Calicut Elite",
    category: "",
    member_count: 4,
    amount: 4000,
    consent_accepted: true,
    payment_status: "payment_submitted",
    payment_reference: "UTR123456789",
    payment_screenshot_url: null,
    payment_screenshot_file_id: null,
    notes: "Sample family of 4",
  },
  {
    registration_id: "BNI-AFL-0003",
    name: "Meera Nair",
    phone: "9988776655",
    email: "meera@example.com",
    region: "Wayanad",
    chapter: "BNI Malabar Connect",
    category: "",
    member_count: 6,
    amount: 6000,
    consent_accepted: true,
    payment_status: "approved",
    payment_reference: "UTR987654321",
    payment_screenshot_url: null,
    payment_screenshot_file_id: null,
    notes: "Sample 6 members × ₹1000",
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const registrations = db.collection("registrations");
  const counters = db.collection("counters");

  await registrations.createIndex({ registration_id: 1 }, { unique: true });

  const now = new Date();
  for (const sample of samples) {
    await registrations.updateOne(
      { registration_id: sample.registration_id },
      {
        $set: {
          ...sample,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true }
    );
  }

  await counters.updateOne(
    { _id: "default" },
    { $max: { last_value: 3 } },
    { upsert: true }
  );

  console.log(`Seeded ${samples.length} sample registrations into ${dbName}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
