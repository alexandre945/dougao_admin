import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma"; 

const TZ = "America/Sao_Paulo";

/**
 * GET /api/order-admin/summary?day=YYYY-MM-DD
 * Ex: /api/order-admin/summary?day=2026-01-27
 *
 * Turno do dia:
 * - Início: 18:00 (BR) do "day"
 * - Fim:    01:00 (BR) do dia seguinte
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");

  if (!day) {
    return NextResponse.json(
      { error: "Parâmetro 'day' é obrigatório (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const startBR = DateTime.fromISO(day, { zone: TZ }).set({
    hour: 18,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const endBR = startBR.plus({ days: 1 }).set({
    hour: 1,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const startUTC = startBR.toUTC().toJSDate();
  const endUTC = endBR.toUTC().toJSDate();

  const agg = await prisma.orderAdmin.aggregate({
    where: { createdAt: { gte: startUTC, lt: endUTC } },
    _sum: { total: true },
    _count: { _all: true },
  });

  // Se total for Decimal no Prisma, ele vem como Decimal (depende do seu schema).
  // Aqui eu normalizei para number por segurança:
  const totalValueRaw: any = agg._sum.total ?? 0;
  const totalValue =
    typeof totalValueRaw === "number"
      ? totalValueRaw
      : Number(totalValueRaw?.toString?.() ?? totalValueRaw);

  return NextResponse.json({
    day,
    tz: TZ,
    rangeBR: { start: startBR.toISO(), end: endBR.toISO() },
    totalOrders: agg._count._all,
    totalValue,
  });
}
