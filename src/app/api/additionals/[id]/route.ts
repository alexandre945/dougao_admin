import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const additionalId = Number(id);

  if (isNaN(additionalId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { name, price, active } = await req.json();

  const updated = await prisma.additional.update({
    where: { id: additionalId },
    data: {
      name,
      price,
      active,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.additional.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ ok: true });
}
