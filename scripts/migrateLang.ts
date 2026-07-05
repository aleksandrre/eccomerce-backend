/**
 * One-time migration: converts single-language string fields to { en, ka, ru } objects.
 * Run with: npx ts-node scripts/migrateLang.ts
 *
 * Safe to run multiple times — skips documents that are already migrated.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

function wrap(value: unknown) {
  if (value === null || value === undefined) return { en: "", ka: "", ru: "" };
  if (typeof value === "string") return { en: value, ka: "", ru: "" };
  return value;
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;

  // ── FoodCategory ──────────────────────────────────────────────
  const foodCats = db.collection("FoodCategory");
  const fcDocs = await foodCats.find({}).toArray();
  for (const doc of fcDocs) {
    if (typeof doc.name === "string") {
      const ka = typeof doc.geoName === "string" ? doc.geoName : "";
      await foodCats.updateOne(
        { _id: doc._id },
        { $set: { name: { en: doc.name, ka, ru: "" } }, $unset: { geoName: "" } }
      );
      console.log(`FoodCategory migrated: ${doc._id}`);
    }
  }

  // ── AnimalCategory ────────────────────────────────────────────
  const animalCats = db.collection("AnimalCategory");
  const acDocs = await animalCats.find({}).toArray();
  for (const doc of acDocs) {
    if (typeof doc.name === "string") {
      const ka = typeof doc.geoName === "string" ? doc.geoName : "";
      await animalCats.updateOne(
        { _id: doc._id },
        { $set: { name: { en: doc.name, ka, ru: "" } }, $unset: { geoName: "" } }
      );
      console.log(`AnimalCategory migrated: ${doc._id}`);
    }
  }

  // ── FoodProduct ───────────────────────────────────────────────
  const foodProds = db.collection("FoodProduct");
  const fpDocs = await foodProds.find({}).toArray();
  for (const doc of fpDocs) {
    const update: Record<string, unknown> = {};
    if (typeof doc.name === "string") update.name = wrap(doc.name);
    if (typeof doc.longDescription === "string") update.longDescription = wrap(doc.longDescription);
    if (typeof doc.shortDescription === "string") update.shortDescription = wrap(doc.shortDescription);
    if (Object.keys(update).length) {
      await foodProds.updateOne({ _id: doc._id }, { $set: update });
      console.log(`FoodProduct migrated: ${doc._id}`);
    }
  }

  // ── AnimalProduct ─────────────────────────────────────────────
  const animalProds = db.collection("AnimalProduct");
  const apDocs = await animalProds.find({}).toArray();
  for (const doc of apDocs) {
    const update: Record<string, unknown> = {};
    if (typeof doc.name === "string") update.name = wrap(doc.name);
    if (typeof doc.longDescription === "string") update.longDescription = wrap(doc.longDescription);
    if (typeof doc.shortDescription === "string") update.shortDescription = wrap(doc.shortDescription);
    if (Object.keys(update).length) {
      await animalProds.updateOne({ _id: doc._id }, { $set: update });
      console.log(`AnimalProduct migrated: ${doc._id}`);
    }
  }

  // ── FAQ ───────────────────────────────────────────────────────
  const faqs = db.collection("FAQ");
  const faqDocs = await faqs.find({}).toArray();
  for (const doc of faqDocs) {
    const update: Record<string, unknown> = {};
    if (typeof doc.name === "string") update.name = wrap(doc.name);

    if (Array.isArray(doc.questions)) {
      update.questions = doc.questions.map((q: Record<string, unknown>) => ({
        ...q,
        question: typeof q.question === "string" ? wrap(q.question) : q.question,
        answer: typeof q.answer === "string" ? wrap(q.answer) : q.answer,
      }));
    }

    if (Object.keys(update).length) {
      await faqs.updateOne({ _id: doc._id }, { $set: update });
      console.log(`FAQ migrated: ${doc._id}`);
    }
  }

  await mongoose.disconnect();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
