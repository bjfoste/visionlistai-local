import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import fse from "fs-extra";
import Busboy from "busboy";
import { prisma } from "@/lib/prisma";
console.log("VISIONLIST_UPLOADS_DIR =", process.env.VISIONLIST_UPLOADS_DIR);

export const runtime = "nodejs";

function randomId() {
  const crypto = require("node:crypto");
  return "b_" + crypto.randomBytes(8).toString("hex") + Date.now().toString(16);
}

export async function POST(req: Request) {
  const uploadsDir =
  process.env.VISIONLIST_UPLOADS_DIR ||
  path.join(process.cwd(), "hot", "uploads");

console.log("process.cwd() =", process.cwd());
console.log("uploadsDir =", uploadsDir);

await fse.ensureDir(uploadsDir);


  const { Readable } = require("node:stream");
  const nodeStream = Readable.fromWeb(req.body as any);

  const bb = Busboy({
    headers: Object.fromEntries(req.headers.entries()),
    limits: {
      files: 1,
      fileSize: 6 * 1024 * 1024 * 1024, // 6GB max
    },
  });

  const batchId = randomId();
  let sourceZipName = "";
  const destZipPath = path.join(uploadsDir, `${batchId}.zip`);
  let fileWritePromise: Promise<void> | null = null;

  bb.on("file", (_name: string, file: any, info: any) => {
    const { filename } = info;
    sourceZipName = filename || `${batchId}.zip`;

    if (!sourceZipName.toLowerCase().endsWith(".zip")) {
      file.resume();
      bb.emit("error", new Error("Only .zip files allowed"));
      return;
    }

    const ws = fs.createWriteStream(destZipPath);

    fileWritePromise = new Promise<void>((resolve, reject) => {
      file.on("error", reject);
      ws.on("error", reject);
      ws.on("finish", resolve);
      file.pipe(ws);
    });
  });

  const done = new Promise<{ batchId: string }>((resolve, reject) => {
    bb.on("finish", async () => {
      try {
        if (!fileWritePromise) throw new Error("No file received");
        await fileWritePromise;

        await prisma.batch.create({
          data: {
            id: batchId,
            sourceZipName,
            zipPath: destZipPath,
            status: "UPLOADED",
          },
        });

        resolve({ batchId });
      } catch (e) {
        reject(e);
      }
    });

    bb.on("error", reject);
  });

  nodeStream.pipe(bb);

  try {
    const result = await done;
    return NextResponse.json(result);
  } catch (e: any) {
    try { await fse.remove(destZipPath); } catch {}
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
