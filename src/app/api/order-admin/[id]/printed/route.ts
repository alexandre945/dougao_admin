import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // <- aqui está o fix
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: `ID inválido: ${id}` }, { status: 400 });
  }

  await prisma.orderAdmin.update({
    where: { id: orderId },
    data: { printedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
