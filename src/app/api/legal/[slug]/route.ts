import { NextResponse } from "next/server";
import { getLegalDocument } from "@/lib/legal-docs";

/** One policy document (protection, cancellation or privacy) as questions and answers. */
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const document = getLegalDocument(String(slug ?? "").toLowerCase());
  if (!document) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    { data: document },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}
