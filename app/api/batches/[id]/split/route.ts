import { NextResponse } from "next/server";
import { splitBatchIntoItems } from "@/lib/splitIntoItems";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const result = await splitBatchIntoItems(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
  console.error("SPLIT ERROR:", e?.stack || e);
  return NextResponse.json(
    { ok: false, error: String(e?.stack || e?.message || e) },
    { status: 500 }
  );
}

}
