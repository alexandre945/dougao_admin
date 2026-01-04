import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}


export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;  // 🔥 PEGANDO ID CERTO
  console.log("params recebido:", id);

  const productId = Number(id);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const exists = await prisma.product.findUnique({ where: { id: productId } });

  if (!exists) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 }
    );
  }

  await prisma.product.delete({ where: { id: productId } });

  return NextResponse.json({
    message: "Produto removido com sucesso",
    id: productId,
  });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { name, description, price, categoryId, active } = data;

    // Validação mínima
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, price, categoryId" },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description ?? null,
        price,
        categoryId,
        active: active ?? true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar produto" },
      { status: 500 }
    );
  }
}

