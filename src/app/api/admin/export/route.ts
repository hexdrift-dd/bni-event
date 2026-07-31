import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listRegistrations } from "@/lib/registrations";
import { registrationsToCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listRegistrations();
    const csv = registrationsToCsv(rows);
    const filename = `bni-registrations-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to export CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
