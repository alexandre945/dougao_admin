"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const sortedOrders = Array.isArray(orders)
  ? [...orders].sort((a: any, b: any) => {
      const aPrinted = a.printedAt ? 1 : 0;
      const bPrinted = b.printedAt ? 1 : 0;
      return aPrinted - bPrinted; // não impresso primeiro
    })
  : [];

  // 🔹 Labels de tipo
  const tipoLabel: Record<string, string> = {
    RETIRADA: "Retirada",
    BALCAO: "Balcão",
    ENTREGA: "Entrega",
  };
  // helper (de preferência fora da função imprimir)
async function markOrderAsPrintedSafe(orderId: number) {
  try {
    const res = await fetch(`/api/order-admin/${orderId}/printed`, {
      method: "POST",
      cache: "no-store",
    });

    const text = await res.text(); // <- pega a mensagem real

    if (!res.ok) {
      console.error("printed endpoint error:", res.status, text);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (e) {
    console.error("fetch failed:", e);
    return null;
  }
}



 async function imprimirPedido(order: any) {
  let conteudo = "";

  const type = order?.customer?.type;
  const origin = order?.origin;

  const isBalcao = type === "BALCAO";
  const isEntrega = type === "ENTREGA";
  const isRetirada = type === "RETIRADA";

  const nome = (order?.customer?.name ?? "").toString().trim();

  const DELIVERY_FEE = 7;

  // ✅ calcula subtotal (itens + adicionais com preço)
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemsTotal = items.reduce((sum: number, item: any) => {
    const base = Number(item.price || 0) * Number(item.quantity || 0);

    const adds = (Array.isArray(item.additionals) ? item.additionals : []).reduce(
      (s: number, ad: any) => s + Number(ad.price || 0) * Number(ad.quantity || 0),
      0
    );

    return sum + base + adds;
  }, 0);

  const fee = isEntrega ? DELIVERY_FEE : 0;
  const totalFinal = itemsTotal + fee;

  conteudo += `PEDIDO #${order.id}\n`;
  conteudo += `-----------------------------\n`;

  if (origin === "CLIENT_WHATSAPP") conteudo += `Origem: WHATSAPP\n`;
  if (origin === "PDV_ADMIN") conteudo += `Origem: PDV / ADMIN\n`;

  conteudo += `Tipo: ${tipoLabel[type] ?? "-"}\n\n`;

  if (isBalcao) {
    conteudo += `Cliente: ${nome || "BALCÃO"}\n`;
  } else {
    conteudo += `Cliente: ${nome || "Não informado"}\n`;
  }

  if (isBalcao) {
    conteudo += `Mesa: ${order.customer?.table || "-"}\n`;
  }

  if (isRetirada || isEntrega) {
    conteudo += `WhatsApp: ${order.customer?.phone || "-"}\n`;
  }

  // 🚚 ENTREGA (✅ agora com Complemento e taxa depois)
  if (isEntrega) {
    const street = order.customer?.address?.street ?? "-";
    const bairro = order.customer?.address?.bairro ?? "-";

    // ✅ tenta pegar “complemento” por variações comuns
    const complemento =
      order.customer?.address?.complement ??
      order.customer?.address?.complemento ??
      "";

    conteudo += `Endereço: ${street}\n`;

    if (complemento) {
      conteudo += `Compl.: ${complemento}\n`;
    }

    conteudo += `Bairro: ${bairro}\n`;

    if (order.customer?.address?.reference) {
      conteudo += `Ref.: ${order.customer.address.reference}\n`;
    }
  }

  if (order.customer?.note) {
    conteudo += `\nOBS: ${order.customer.note}\n`;
  }

  // 🍔 ITENS
  conteudo += `\nItens:\n`;
  items.forEach((item: any) => {
    conteudo += `- ${item.name} x${item.quantity}  R$ ${(
      Number(item.price || 0) * Number(item.quantity || 0)
    ).toFixed(2)}\n`;

    (Array.isArray(item.additionals) ? item.additionals : []).forEach((ad: any) => {
      const adTotal = Number(ad.price || 0) * Number(ad.quantity || 0);
      // ✅ se quiser mostrar preço do adicional:
      conteudo += `   + ${ad.name} (${ad.quantity}x)  R$ ${adTotal.toFixed(2)}\n`;
    });
  });

  // 💰 PAGAMENTO
  conteudo += `\nPagamento:\n`;

  if (order.payment?.forma === "dinheiro") {
    conteudo += `- Dinheiro\n`;
    if (order.payment?.trocoPara) {
      conteudo += `  Troco para: R$ ${Number(order.payment.trocoPara).toFixed(2)}\n`;
    }
  }

  if (order.payment?.forma === "cartao") {
    conteudo += `- Cartão (${order.payment.tipoCartao})\n`;
    if (order.payment?.maquininha) {
      conteudo += `  Máquina: ${order.payment.maquininha}\n`;
    }
  }

  if (order.payment?.forma === "pix") {
    conteudo += `- PIX\n`;
    if (order.payment?.maquininha) {
      conteudo += `  Máquina: ${order.payment.maquininha}\n`;
    }
  }

  // ✅ TOTAIS (agora imprime taxa + subtotal + total final)
  conteudo += `\n-----------------------------\n`;
  conteudo += `Subtotal: R$ ${itemsTotal.toFixed(2)}\n`;
  if (isEntrega) {
    conteudo += `Taxa entrega: R$ ${fee.toFixed(2)}\n`;
  }
  conteudo += `TOTAL: R$ ${totalFinal.toFixed(2)}\n`;
  conteudo += `-----------------------------\n`;
  conteudo += `Obrigado!\n`;

  // 🖨️ PRINT
  const win = window.open("", "", "width=300,height=600");
  if (!win) return;

  // (opcional) escapar HTML pra não dar zebra se tiver < ou &
  const escapeHtml = (s: string) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  win.document.write(`
    <pre style="
      font-family: monospace;
      font-size: 12px;
      line-height: 1.2;
      white-space: pre-wrap;
      margin: 0;
    ">${escapeHtml(conteudo)}</pre>
  `);

  win.document.close();
  win.focus();
  win.print();

  await markOrderAsPrintedSafe(order.id);
}


  // 🗑️ EXCLUIR PEDIDO (VERSÃO SEGURA)
  async function excluirPedido(id: number) {
    if (!confirm("Deseja excluir este pedido?")) return;

    const res = await fetch(`/api/order-admin/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir pedido. Tente novamente.");
      return;
    }

    // remove da tela só se o backend confirmou
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  // 📥 BUSCAR PEDIDOS
  useEffect(() => {
    fetch("/api/order-admin")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error("Resposta inesperada:", data);
          setOrders([]);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar pedidos:", err);
        setOrders([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <a
        href="/admin"
        className="inline-block mb-4 text-white bg-red-800 px-4 py-2 rounded-lg shadow hover:bg-red-900 transition"
      >
        ⬅ Voltar
      </a>

      <h1 className="text-2xl font-bold mb-4 text-center">
        Histórico de Pedidos
      </h1>
       
      <div className="space-y-4">
        {sortedOrders.map((order: any) => {


          const isPrinted = !!order.printedAt;

           const DELIVERY_FEE = 7;

            const itemsTotal = (Array.isArray(order.items) ? order.items : []).reduce(
              (sum: number, item: any) => {
                const base = Number(item.price || 0) * Number(item.quantity || 0);

                const adds = (Array.isArray(item.additionals) ? item.additionals : []).reduce(
                  (s: number, ad: any) => s + Number(ad.price || 0) * Number(ad.quantity || 0),
                  0
                );

                return sum + base + adds;
              },
              0
            );

            const customerType = String(order.customer?.type || "")
              .trim()
              .toUpperCase();

            const fee = customerType === "ENTREGA" ? DELIVERY_FEE : 0;
            const totalFinal = itemsTotal + fee;


                  return (
                    <div
                      key={order.id}
                      className={[
                        "border rounded p-4 space-y-2 transition",
                        isPrinted ? "bg-gray-50 opacity-60 grayscale" : "bg-gray-50",
                      ].join(" ")}
                    >
                      {/* CABEÇALHO */}
                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <strong>Pedido #{order.id}</strong>
 

                          {isPrinted && (
                            <span className="text-[11px] rounded-full bg-white px-2 py-0.5 border text-gray-700">
                              🖨️ Impresso
                            </span>
                          )}
                        </div>

                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                      </div>

                      <p className="text-xs italic text-gray-500">
                        Origem:{" "}
                        {order.origin === "CLIENT_WHATSAPP"
                          ? "Cliente (WhatsApp)"
                          : "PDV / Admin"}
                      </p>

                      <p>
                        <strong>Tipo:</strong> {tipoLabel[order.customer?.type] ?? "—"}
                      </p>

                      <p>
                        <strong>Cliente:</strong> {order.customer?.name ?? "—"}
                      </p>

                      {/* BALCÃO */}
                      {order.customer?.type === "BALCAO" && (
                        <p>
                          <strong>Mesa:</strong> {order.customer?.table ?? "—"}
                        </p>
                      )}

                      {/* RETIRADA / ENTREGA */}
                      {order.customer?.type !== "BALCAO" && (
                        <p>
                          <strong>WhatsApp:</strong> {order.customer?.phone ?? "—"}
                        </p>
                      )}

                      {/* ENTREGA */}
                      {order.customer?.type === "ENTREGA" && (
                        <>
     
                          <p>
                            <strong>Endereço:</strong>{" "}
                            {order.customer?.address?.street ?? "—"}
                          </p>

                          {!!order.customer?.address?.complement && (
                            <p>
                              <strong>Complemento:</strong> {order.customer.address.complement}
                            </p>
                          )}

                          <p>
                            <strong>Bairro:</strong>{" "}
                            {order.customer?.address?.bairro ?? "—"}
                          </p>

                          {order.customer?.address?.reference && (
                            <p>
                              <strong>Referência:</strong> {order.customer.address.reference}
                            </p>
                          )}
                        </>
                      )}

                      {order.customer?.note && (
                        <p className="italic text-sm bg-yellow-50 p-2 rounded">
                          📝 {order.customer.note}
                        </p>
                      )}

                      {order.payment && (
                        <div className="mt-2 text-sm">
                          <strong>Pagamento:</strong>{" "}
                          {order.payment.forma === "dinheiro" && "Dinheiro"}
                          {order.payment.forma === "cartao" &&
                            `Cartão ${order.payment.tipoCartao}`}
                          {order.payment.forma === "pix" && "Pix"}
                          {order.payment.forma === "dinheiro" && order.payment.trocoPara && (
                            <p>
                              Troco para: R${" "}
                              {Number(order.payment.trocoPara).toFixed(2)}
                            </p>
                          )}
                          {(order.payment.forma === "cartao" || order.payment.forma === "pix") &&
                            order.payment.maquininha && (
                              <p>Maquininha: {order.payment.maquininha}</p>
                            )}
                        </div>
                      )}

                      <hr />

                      {/* ITENS */}
                      <div className="space-y-2 text-sm">
                        <strong>Itens:</strong>

                        {(Array.isArray(order.items) ? order.items : []).map(
                          (item: any, idx: number) => (
                            <div key={idx}>
                              <p>
                                {item.name} ({item.quantity})
                              </p>

                              <p>R$ {(item.price * item.quantity).toFixed(2)}</p>

                              {item.additionals?.map((ad: any, i: number) => (
                                <p key={i} className="ml-4 text-gray-600">
                                  + {ad.name} ({ad.quantity}x)
                                </p>
                              ))}
                            </div>
                          )
                        )}
                      </div>

                      <hr />

                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>R$ {itemsTotal.toFixed(2)}</span>

                          </div>

                          {order.customer?.type === "ENTREGA" && (
                            <div className="flex justify-between">
                              <span>Taxa de entrega</span>
                              <span>R$ {DELIVERY_FEE.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-base border-t pt-2">
                            <span>Total</span>
                            <span>R$ {totalFinal.toFixed(2)}</span>
                          </div>
                        </div>


                      {/* AÇÕES */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => imprimirPedido(order)}
                          disabled={isPrinted} // opcional: trava reprint
                          className={[
                            "flex-1 text-white py-2 rounded font-bold transition",
                            isPrinted ? "bg-green-600/60 cursor-not-allowed" : "bg-green-600",
                          ].join(" ")}
                        >
                          🖨️ Imprimir
                        </button>

                        <button
                          onClick={() => excluirPedido(order.id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded font-bold"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
      </div>


    </div>
  );
}
