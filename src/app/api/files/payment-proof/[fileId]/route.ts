import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentProofFile } from "@/lib/registrations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  const file = await getPaymentProofFile(fileId);

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of file.stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
