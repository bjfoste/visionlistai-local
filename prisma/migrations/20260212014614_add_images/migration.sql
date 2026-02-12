-- CreateTable
CREATE TABLE "BatchImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "exifDate" DATETIME,
    "sortIndex" INTEGER,
    CONSTRAINT "BatchImage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "sku" TEXT,
    "weightOz" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Item_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
