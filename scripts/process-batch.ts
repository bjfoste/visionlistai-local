import path from "path";
import fse from "fs-extra";
import unzipper from "unzipper";
import exifr from "exifr";
import { prisma } from "../lib/prisma";

// Local SSD work area (fallback if env var not set)
const WORK =
  process.env.VISIONLIST_WORK_DIR || path.join(process.cwd(), "hot", "work");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

async function extractZip(zipPath: string, outDir: string) {
  await fse.ensureDir(outDir);
  await fse
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: outDir }))
    .promise();
}

async function getExifDate(filePath: string): Promise<Date | null> {
  try {
    const data: any = await exifr.parse(filePath, {
      tiff: true,
      ifd0: true,
      exif: true,
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });

    const d =
      data?.DateTimeOriginal || data?.CreateDate || data?.ModifyDate || null;

    if (!d) return null;
    return d instanceof Date ? d : new Date(d);
  } catch {
    return null;
  }
}

async function main() {
  const batchId = process.argv[2];
  if (!batchId) {
    console.error("Usage: tsx scripts/process-batch.ts <batchId>");
    process.exit(1);
  }

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error("Batch not found: " + batchId);

  const extractDir = path.join(WORK, batchId, "extracted");

  console.log("Processing batch:", batchId, batch.sourceZipName);
  console.log("zipPath =", batch.zipPath);
  console.log("extractDir =", extractDir);

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "PROCESSING" },
  });

  // 1) unzip (local SSD)
  await fse.remove(extractDir);
  await extractZip(batch.zipPath, extractDir);

  // 2) collect images (recursive)
  const allFiles: string[] = [];
  const walk = async (dir: string) => {
    const entries = await fse.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else allFiles.push(full);
    }
  };
  await walk(extractDir);

  const imageFiles = allFiles.filter((f) =>
    IMAGE_EXTS.has(path.extname(f).toLowerCase())
  );

  console.log("Found images:", imageFiles.length);

  // 3) read exif dates + sort
  const enriched = await Promise.all(
    imageFiles.map(async (filePath) => {
      const exifDate = await getExifDate(filePath);
      return {
        filePath,
        fileName: path.basename(filePath),
        exifDate,
        sortKey: exifDate ? exifDate.getTime() : 0,
      };
    })
  );

  enriched.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    return a.fileName.localeCompare(b.fileName);
  });

  // 4) write to DB (clear old first)
  await prisma.batchImage.deleteMany({ where: { batchId } });

  await prisma.batchImage.createMany({
    data: enriched.map((img, i) => ({
      batchId,
      imagePath: img.filePath,
      fileName: img.fileName,
      exifDate: img.exifDate,
      sortIndex: i,
    })),
  });

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "EXTRACTED" },
  });

  console.log("✅ Batch extracted + indexed:", batchId);
}

main().catch((e) => {
  console.error("❌ process-batch failed:", e);
  process.exit(1);
});
