import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — listar categorias
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(categories);
}

// POST — criar categoria
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const exists = await prisma.category.findFirst({ where: { name } });

    if (exists) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
