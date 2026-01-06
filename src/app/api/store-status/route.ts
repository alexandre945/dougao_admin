import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const row = await prisma.storeStatus.findUnique({
    where: { id: 1 },
  });

  return NextResponse.json({
    isOpen: row?.isOpen ?? false,
    mode: row?.mode ?? "AUTO",
    updatedAt: row?.updatedAt ?? null,
    message: (row?.isOpen ?? false)
      ? "Estamos abertos agora! Faça seu pedido 👇"
      : "Estamos fechados no momento. Abrimos de terça a domingo às 19:00.",
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  // action pode ser: "set" (manual) ou "auto" (voltar automático)
  const action = body?.action as "set" | "auto" | undefined;

  if (action === "auto") {
    const updated = await prisma.storeStatus.update({
      where: { id: 1 },
      data: { mode: "AUTO" },
    });

    return NextResponse.json({
      isOpen: updated.isOpen,
      mode: updated.mode,
      updatedAt: updated.updatedAt,
    });
  }

  // padrão: manual
  const isOpen = Boolean(body?.isOpen);

  const updated = await prisma.storeStatus.update({
    where: { id: 1 },
    data: {
      isOpen,
      mode: "MANUAL",
    },
  });

  return NextResponse.json({
    isOpen: updated.isOpen,
    mode: updated.mode,
    updatedAt: updated.updatedAt,
  });
}
