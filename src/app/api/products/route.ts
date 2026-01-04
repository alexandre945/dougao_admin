import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, description, price, categoryId, position } = data;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "name, price e categoryId são obrigatórios" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price,
        categoryId,
        position: position || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar produto" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    include: {
      category: true,
    },
    orderBy: {
      position: "asc",
    },
  });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar produtos" },
      { status: 500 }
    );
  }
}
