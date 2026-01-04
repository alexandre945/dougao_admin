import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
  const products = await prisma.product.findMany({

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
