import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CustomerType = "RETIRADA" | "BALCAO" | "ENTREGA";
type OriginType = "CLIENT_WHATSAPP" | "PDV_ADMIN";

function normalizeCustomerType(raw: any): CustomerType {
  const v = String(raw ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  // Aceita variações comuns sem quebrar
  if (v.includes("ENTRE")) return "ENTREGA";
  if (v.includes("BALCA") || v.includes("BALC")) return "BALCAO";
  if (v.includes("RETIR")) return "RETIRADA";

  // fallback seguro
  return "RETIRADA";
}

function normalizeOrigin(raw: any): OriginType {
  const v = String(raw ?? "")
    .trim()
    .toUpperCase();

  if (v === "CLIENT_WHATSAPP") return "CLIENT_WHATSAPP";
  if (v === "PDV_ADMIN") return "PDV_ADMIN";

  // fallback: se não vier, assume PDV (porque esse endpoint hoje é do PDV)
  return "PDV_ADMIN";
}

function normalizePhone(raw: any): string {
  // mantém só dígitos (55 + DDD + número)
  return String(raw ?? "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  console.log("DATABASE_URL API:", process.env.DATABASE_URL);

  try {
    const body = await req.json();
    const { items } = body;
    console.log("BODY RECEBIDO:", body);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Itens inválidos" }, { status: 400 });
    }

    // 🔹 Calcula total no backend
    const total = items.reduce((sum: number, item: any) => {
      const productTotal = Number(item.price) * Number(item.quantity);

      const additionalsTotal = (item.additionals || []).reduce(
        (a: number, ad: any) => a + Number(ad.price) * Number(ad.quantity),
        0
      );

      return sum + productTotal + additionalsTotal;
    }, 0);

    // ✅ origin vindo do front (ou fallback)
    const origin = normalizeOrigin(body.origin);

    // ✅ customer padronizado
    const type = normalizeCustomerType(body.customer?.type);
    const rawCustomer = body.customer ?? null;

    const customer = rawCustomer
  ? {
      name: String(rawCustomer?.name ?? "").trim(),
      phone: normalizePhone(rawCustomer?.phone),
      type,
      note: String(rawCustomer?.note ?? "").trim() || undefined, // ✅ aqui

      table:
        type === "BALCAO"
          ? String(rawCustomer?.table ?? "").trim()
          : undefined,

      address:
        type === "ENTREGA"
          ? {
              street: String(rawCustomer?.address?.street ?? "").trim(),
              number: String(rawCustomer?.address?.number ?? "").trim() || undefined,
              complement:
              String(rawCustomer?.address?.complement ?? "").trim() || undefined,
              bairro: String(rawCustomer?.address?.bairro ?? "").trim(),
              reference:
                String(rawCustomer?.address?.reference ?? "").trim() || undefined,
            }
          : undefined,

    }
  : null;
    // ✅ validações mínimas (pra não salvar lixo)
    if (!customer?.name) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
    }

    if (type === "BALCAO" && !customer?.table) {
      return NextResponse.json({ error: "Mesa é obrigatória no BALCÃO" }, { status: 400 });
    }

    if (type === "ENTREGA") {
      if (!customer?.address?.street || !customer?.address?.bairro) {
        return NextResponse.json(
          { error: "Endereço incompleto (rua e bairro obrigatórios)" },
          { status: 400 }
        );
      }
    }

    const order = await prisma.orderAdmin.create({
      data: {
        total,
        status: "pending",
        items,
        payment: body.payment,
        origin,
        customer,
      },
    });
    

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error) {
    console.error("ERRO ORDER-ADMIN:", error);
    return NextResponse.json({ error: "Erro ao salvar pedido" }, { status: 500 });
    
  }


}

export async function GET() {
  console.log("DATABASE_URL API:", process.env.DATABASE_URL);

  try {
    const orders = await prisma.orderAdmin.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }
}
