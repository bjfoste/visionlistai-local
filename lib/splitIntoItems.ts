import { prisma } from "@/lib/prisma";

function isDelimiter(fileName: string) {
  const n = fileName.toLowerCase();
  // Placeholder logic — we’ll replace with vision later
  return n.includes("sku") || n.includes("weight") || n.includes("label");
}

export async function splitBatchIntoItems(batchId: string) {
  // Clear previous assignments so you can re-run safely
  await prisma.batchImage.updateMany({
    where: { batchId },
    data: { itemId: null },
  });
  await prisma.item.deleteMany({ where: { batchId } });

  const images = await prisma.batchImage.findMany({
    where: { batchId },
    orderBy: [{ sortIndex: "asc" }, { fileName: "asc" }],
  });

  if (images.length === 0) {
    throw new Error("No images found for batch " + batchId);
  }

  let current: string[] = [];
  let created = 0;

  for (const img of images) {
    current.push(img.id);

    if (isDelimiter(img.fileName)) {
      const item = await prisma.item.create({
        data: { batchId, status: "PENDING" },
      });

      await prisma.batchImage.updateMany({
        where: { id: { in: current } },
        data: { itemId: item.id },
      });

      created++;
      current = [];
    }
  }

  // leftover images at end
  if (current.length > 0) {
    const item = await prisma.item.create({
      data: { batchId, status: "PENDING" },
    });

    await prisma.batchImage.updateMany({
      where: { id: { in: current } },
      data: { itemId: item.id },
    });

    created++;
  }

  return { batchId, itemCount: created, imageCount: images.length };
}
