"use client";
import { useRef, useState } from "react";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");
  const [batchId, setBatchId] = useState("");

  async function uploadFile(file: File) {
    setStatus("Uploading...");
    setBatchId("");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/batches/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(`❌ ${data?.error || "Upload failed"}`);
      return;
    }

    setStatus("✅ Upload complete");
    setBatchId(data.batchId);
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Upload ZIP Batch</h1>

      <button
        onClick={() => inputRef.current?.click()}
        style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10 }}
      >
        Select ZIP
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
        }}
      />

      {status && <div style={{ marginTop: 16 }}>{status}</div>}
      {batchId && (
        <div style={{ marginTop: 8 }}>
          Batch ID: <code>{batchId}</code>
        </div>
      )}
    </div>
  );
}
