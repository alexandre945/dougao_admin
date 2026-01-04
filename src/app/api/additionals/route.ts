import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ➤ Criar adicional
export async function POST(req: Request) {
  try {
    const { name, price } = await req.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name e price" },
        { status: 400 }
      );
    }

    const additional = await prisma.additional.create({
      data: { name, price },
    });

    return NextResponse.json(additional);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar adicional" },
      { status: 500 }
    );
  }
}

// ➤ Listar adicionais
export async function GET() {
  const all = await prisma.additional.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json(all);
}
