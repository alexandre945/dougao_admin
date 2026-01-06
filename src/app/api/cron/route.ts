import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // "open" | "close"
  const secret = searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (action !== "open" && action !== "close") {
    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  }

  const isOpen = action === "open";

  // 🔥 só atualiza se estiver em AUTO
  const result = await prisma.storeStatus.updateMany({
    where: { id: 1, mode: "AUTO" },
    data: { isOpen },
  });

  return NextResponse.json({
    ok: true,
    action,
    attemptedSetIsOpen: isOpen,
    updatedRows: result.count, // 1 se aplicou, 0 se estava MANUAL
  });
}
