import { prisma } from "../lib/prisma";

export default async function Home() {
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>
        VisionListAI – Imported Batches
      </h1>

      {batches.length === 0 && <p>No batches yet.</p>}

      {batches.map((batch) => (
        <div
          key={batch.id}
          style={{
            padding: 12,
            border: "1px solid #ccc",
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <strong>{batch.sourceZipName}</strong>
          <div>ID: {batch.id}</div>
          <div>Status: {batch.status}</div>
          <div>Zip: {batch.zipPath}</div>
          <div>Created: {new Date(batch.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </main>
  );
}
