-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BatchImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "itemId" TEXT,
    "imagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "exifDate" DATETIME,
    "sortIndex" INTEGER,
    CONSTRAINT "BatchImage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BatchImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BatchImage" ("batchId", "exifDate", "fileName", "id", "imagePath", "sortIndex") SELECT "batchId", "exifDate", "fileName", "id", "imagePath", "sortIndex" FROM "BatchImage";
DROP TABLE "BatchImage";
ALTER TABLE "new_BatchImage" RENAME TO "BatchImage";
CREATE INDEX "BatchImage_batchId_sortIndex_idx" ON "BatchImage"("batchId", "sortIndex");
CREATE INDEX "BatchImage_itemId_idx" ON "BatchImage"("itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
