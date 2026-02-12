import { prisma } from "../lib/prisma";
import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import { prisma } from "../lib/prisma";


console.log("ENV DATABASE_URL =", process.env.DATABASE_URL);
console.log("ENV VISIONLIST_STORAGE_ROOT =", process.env.VISIONLIST_STORAGE_ROOT);


const ROOT = process.env.VISIONLIST_STORAGE_ROOT;

if (!ROOT) {
  console.error("❌ Missing VISIONLIST_STORAGE_ROOT in .env.local");
  process.exit(1);
}

const DROPBOX = path.join(ROOT, "dropbox");
const UPLOADS = path.join(ROOT, "uploads");

function randomId() {
  return "b_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

async function main() {
  await fse.ensureDir(DROPBOX);
  await fse.ensureDir(UPLOADS);

  console.log("👀 Watching:", DROPBOX);

  const watcher = chokidar.watch(DROPBOX, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 250,
    },
  });

  watcher.on("add", async (filePath) => {
    try {
      if (!filePath.toLowerCase().endsWith(".zip")) return;

      console.log("📦 ZIP detected:", filePath);

      const batchId = randomId();
      const sourceZipName = path.basename(filePath);
      const destZipPath = path.join(UPLOADS, `${batchId}.zip`);

      await fse.move(filePath, destZipPath);

      await prisma.batch.create({
        data: {
          id: batchId,
          sourceZipName,
          zipPath: destZipPath,
          status: "UPLOADED",
        },
      });

      console.log(`✅ Batch created: ${batchId}`);
    } catch (err) {
      console.error("❌ Import failed:", err);
    }
  });
}

main().catch(console.error);
