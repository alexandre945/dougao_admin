import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 🔥 NEXT 16: params É PROMISE
  const { id } = await context.params;

  console.log("ID recebido:", id);

  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  await prisma.orderAdmin.delete({
    where: { id: orderId },
  });

  return NextResponse.json({
    success: true,
    id: orderId,
  });
}
