"use client";

import Header from "../header/page";
import { useEffect, useState } from "react";

type AdditionalSelected = {
  additionalId: number;
  name: string;
  price: number;
  quantity: number;
};

export default function VendaPage() {
  const [orderType, setOrderType] = useState<"entrega" | "retirada" | "balcao">(
    "balcao"
  );

  const [payment, setPayment] = useState<any>({
    forma: "dinheiro", // dinheiro | cartao | pix
    tipoCartao: "", // debito | credito
    trocoPara: "", // só dinheiro
    maquininha: "", // cartao / pix
  });

  const [customer, setCustomer] = useState({
    tipoPedido: "balcao", // entrega | retirada | balcao
    nome: "",
    mesa: "",
    whatsapp: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    referencia: "",
    observacao: "",
  });


  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [additionals, setAdditionals] = useState<any[]>([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<
    AdditionalSelected[]
  >([]);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // carrinho flutuante (aqui embaixo!)
const [isCartOpen, setIsCartOpen] = useState(false);
const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  function setTipoPedido(tipo: "balcao" | "retirada" | "entrega") {
    setCustomer((prev) => ({
      tipoPedido: tipo,

      // campos comuns
      nome: "",
      observacao: prev.observacao,

      // balcão
      mesa: tipo === "balcao" ? prev.mesa : "",

      // retirada / entrega
      whatsapp: tipo !== "balcao" ? prev.whatsapp : "",

      // entrega
      rua: tipo === "entrega" ? prev.rua : "",
      numero: tipo === "entrega" ? prev.numero : "",
      bairro: tipo === "entrega" ? prev.bairro : "",
      complemento: tipo === "entrega" ? prev.complemento : "",
      referencia: tipo === "entrega" ? prev.referencia : "",
    }));
  }

  // 🔹 AGRUPAR PRODUTOS POR CATEGORIA
  const groupedProducts = products.reduce((acc: any, product: any) => {
    const category = product.category?.name || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  // 🔹 BUSCAR PRODUTOS
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  // 🔹 BUSCAR ADICIONAIS
  useEffect(() => {
    let isMounted = true;
  
   

    fetch("/api/additionals")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar adicionais");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        if (Array.isArray(data)) {
          setAdditionals(data.filter((a: any) => a.active));
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Erro adicionais:", err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  // 🔹 ADD TO CART (COM ADICIONAIS)
  function addToCart(product: any) {
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        additionals: product.additionals || [],
      },
    ]);
  }

  function increase(productId: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decrease(productId: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

 const DELIVERY_FEE = 7;

function subtotal() {
  return cart.reduce((sum, item) => {
    const additionalsTotal = item.additionals.reduce(
      (a: number, ad: any) => a + ad.price * ad.quantity,
      0
    );

    return sum + item.price * item.quantity + additionalsTotal;
  }, 0);
}

function total() {
  const fee = customer.tipoPedido === "entrega" ? DELIVERY_FEE : 0;
  return subtotal() + fee;
}


  function updateCustomer(field: string, value: string) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  // ✅ monta customer no formato novo que o backend espera
  function buildCustomerPayload() {
    const type =
      customer.tipoPedido === "entrega"
        ? "ENTREGA"
        : customer.tipoPedido === "retirada"
          ? "RETIRADA"
          : "BALCAO";

    const name = (customer.nome || "").trim() || "Balcão";
    const phone = (customer.whatsapp || "").trim();

    const payload: any = {
      type,
      name,
      phone,
      note: (customer.observacao || "").trim(),
    };

    if (type === "BALCAO") {
      payload.table = (customer.mesa || "").trim() || "0";
    }

    if (type === "ENTREGA") {
      payload.address = {
        street: (customer.rua || "").trim(),
        number: (customer.numero || "").trim(),
        bairro: (customer.bairro || "").trim(),
        complement: (customer.complemento || "").trim(),
        reference: (customer.referencia || "").trim(),
      };
    }

    return payload;
  }

  async function finalizarVenda() {
    if (cart.length === 0) {
      alert("Carrinho vazio");
      return;
    }

    // 🔹 validações de pagamento
    if (payment.forma === "dinheiro" && !payment.trocoPara) {
      if (!confirm("Pagamento em dinheiro sem troco, confirma?")) {
        return;
      }
    }

    if (payment.forma === "cartao" && !payment.tipoCartao) {
      alert("Selecione débito ou crédito");
      return;
    }

    const customerPayload = buildCustomerPayload();

    // 🔹 validações mínimas do pedido (pra não tomar 400)
    if (customerPayload.type === "ENTREGA") {
      if (!customerPayload.address?.street || !customerPayload.address?.bairro) {
        alert("Entrega exige Rua e Bairro.");
        return;
      }
      if (!customerPayload.name || !customerPayload.phone) {
        alert("Entrega exige Nome e WhatsApp.");
        return;
      }
    }

    if (customerPayload.type === "RETIRADA") {
      if (!customerPayload.name || !customerPayload.phone) {
        alert("Retirada exige Nome e WhatsApp.");
        return;
      }
    }

    // 🔹 PAYLOAD FINAL (formato novo)
    const payload = {
      origin: "PDV_ADMIN",
      items: cart,
      total: total(), // ✅ aqui é número
      customer: customerPayload,
      payment,
    };

    try {
      const res = await fetch("/api/order-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Erro ao salvar pedido:", data);
        alert(data?.error || "Erro ao salvar pedido");
        return;
      }

      console.log("Pedido salvo:", data.orderId);

      // 🔹 limpar estados
      setCart([]);
      setCustomer({
        tipoPedido: "balcao",
        nome: "",
        mesa: "",
        whatsapp: "",
        rua: "",
        numero: "",
        bairro: "",
        complemento: "",
        referencia: "",
        observacao: "",
      });

      alert(`Pedido #${data.orderId} salvo com sucesso`);
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    }
  }

  return (
  <div className="min-h-screen bg-red-600 p-4 text-white">
    <div className="fixed top-0 left-0 right-0 z-50">
      <Header />
    </div>
     
      {/* PRODUTOS */}
      <div className="bg-white text-black p-3 rounded mt-[175px]">
        <h1 className="text-2xl font-bold mb-4 text-center">Venda / Balcão</h1>

        {categories.map((cat) => {
          const productsByCategory = groupedProducts[cat.name] || [];

          if (productsByCategory.length === 0) return null;

          return (
         
            <div key={cat.id} className="mb-4">
                  <h3
                    id={cat.name.toLowerCase().replace(/\s+/g, "")}
                    className="font-bold text-center text-red-600 mb-2 scroll-mt-24"
                  >
                    {cat.name}
                  </h3>

              {productsByCategory.map((p: any, index: number) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    {/* 🔢 NUMERAÇÃO VISUAL */}
                    <p className="font-bold">
                      {index + 1}. {p.name}
                    </p>

                    <p className="text-sm">R$ {Number(p.price).toFixed(2)}</p>

                    <p className="text-xs text-gray-500">{p.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      const categoryName = p.category?.name?.toLowerCase();

                      if (categoryName === "lanches") {
                        // 🔥 só lanches abre modal
                        setSelectedProduct(p);
                        setSelectedAdditionals([]);
                        setIsModalOpen(true);
                      } else {
                        // ✅ outras categorias entram direto no carrinho
                        addToCart({
                          ...p,
                          additionals: [],
                        });
                      }
                    }}
                    className="text-xl"
                  >
                    ➕
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-4 right-4 z-50 bg-yellow-400 text-red-700 font-extrabold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            🛒 Carrinho
            <span className="bg-red-700 text-white text-xs font-bold px-2 py-1 rounded-full">
              {cartCount}
            </span>
          </button>

          {isCartOpen && (
              <div className="fixed inset-0 z-[60]">
                {/* fundo escuro */}
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setIsCartOpen(false)}
                />

                {/* painel */}
                <div className="absolute bottom-0 left-0 right-0 bg-white text-black rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-extrabold">🛒 Carrinho</h2>

                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-3 py-1 rounded-lg border font-semibold"
                    >
                      Fechar
                    </button>
                  </div>

                           {/* CARRINHO */}
      <div className="bg-white text-black p-3 rounded mt-4">
        <h2 className="font-bold mb-2">Carrinho</h2>

        {cart.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum item</p>
        )}

        {cart.map((item) => (
          <div
            key={item.productId}
            className="border-b py-2 flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-sm">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>

              {item.additionals.length > 0 && (
                <ul className="text-xs text-gray-600">
                  {item.additionals.map((ad: any, idx: number) => (
                    <li key={idx}>
                      + {ad.name} ({ad.quantity}x)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => increase(item.productId)}>+</button>
              <span>{item.quantity}</span>
              <button onClick={() => decrease(item.productId)}>−</button>
              <button onClick={() => removeItem(item.productId)}>🗑</button>
            </div>
          </div>
        ))}

        <div className="mt-3 text-right space-y-1">
            <div className="text-sm font-medium">
              Subtotal: R$ {subtotal().toFixed(2)}
            </div>

        
            {customer.tipoPedido === "entrega" && (
              <div className="text-sm font-medium">
                Taxa de entrega: R$ {DELIVERY_FEE.toFixed(2)}
              </div>
            )}
            <div className="font-bold text-lg">
              Total: R$ {total().toFixed(2)}
            </div>
        </div>


        {/* DADOS DO PEDIDO */}
        <div className="mt-4 border-t pt-3">
              <h3 className="font-bold mb-2">Dados do Pedido</h3>

              {/* Tipo */}
              <div className="flex gap-4 mb-3">
                <label>
                  <input
                    type="radio"
                    checked={customer.tipoPedido === "balcao"}
                    onChange={() => setTipoPedido("balcao")}
                  />
                  Balcão
                </label>

                <label>
                  <input
                    type="radio"
                    checked={customer.tipoPedido === "retirada"}
                    onChange={() => setTipoPedido("retirada")}
                  />
                  Retirada
                </label>

                <label>
                  <input
                    type="radio"
                    checked={customer.tipoPedido === "entrega"}
                    onChange={() => setTipoPedido("entrega")}
                  />
                  Entrega
                </label>
              </div>

              {/* BALCÃO */}
              {customer.tipoPedido === "balcao" && (
                <>
                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Nome do cliente (opcional)"
                    value={customer.nome}
                    onChange={(e) => updateCustomer("nome", e.target.value)}
                  />

                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Número da mesa"
                    value={customer.mesa}
                    onChange={(e) => updateCustomer("mesa", e.target.value)}
                  />
                </>
              )}

              {/* RETIRADA / ENTREGA */}
              {customer.tipoPedido !== "balcao" && (
                <>
                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Nome do cliente"
                    value={customer.nome}
                    onChange={(e) => updateCustomer("nome", e.target.value)}
                  />

                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="WhatsApp"
                    value={customer.whatsapp}
                    onChange={(e) => updateCustomer("whatsapp", e.target.value)}
                  />
                </>
              )}

              {/* ENTREGA */}
              {customer.tipoPedido === "entrega" && (
                <>
                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Rua"
                    value={customer.rua}
                    onChange={(e) => updateCustomer("rua", e.target.value)}
                  />

                  <div className="flex gap-2 mb-2">
                    <input
                      className="flex-1 border p-2 rounded"
                      placeholder="Número"
                      value={customer.numero}
                      onChange={(e) => updateCustomer("numero", e.target.value)}
                    />
                    <input
                      className="flex-1 border p-2 rounded"
                      placeholder="Bairro"
                      value={customer.bairro}
                      onChange={(e) => updateCustomer("bairro", e.target.value)}
                    />
                  </div>

                  <input
                    className="w-full border p-2 rounded mb-2"
                    placeholder="Complemento (opcional)"
                    value={customer.complemento}
                    onChange={(e) => updateCustomer("complemento", e.target.value)}
                  />

                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Referência (opcional)"
                    value={customer.referencia}
                    onChange={(e) => updateCustomer("referencia", e.target.value)}
                  />
                </>
              )}
        </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Observação do pedido
              </label>

              <textarea
                value={customer.observacao}
                onChange={(e) =>
                  setCustomer({ ...customer, observacao: e.target.value })
                }
                rows={3}
                placeholder="Ex: sem cebola, pouco sal, chamar no portão..."
                className="w-full border rounded p-2 text-sm"
              />
            </div>

            {/* forma de pagamento */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {["dinheiro", "cartao", "pix"].map((f) => (
                <button
                  key={f}
                  onClick={() =>
                    setPayment({
                      forma: f,
                      tipoCartao: "",
                      trocoPara: "",
                      maquininha: "",
                    })
                  }
                  className={`border rounded py-2 ${payment.forma === f ? "bg-black text-white" : "bg-white"
                    }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* dinheiro troco */}
            {payment.forma === "dinheiro" && (
              <input
                type="number"
                placeholder="Troco para quanto?"
                className="w-full border rounded p-2 mt-2"
                value={payment.trocoPara}
                onChange={(e) => setPayment({ ...payment, trocoPara: e.target.value })}
              />
            )}

            {/* cartão tipo e maquininha */}
            {payment.forma === "cartao" && (
              <>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["debito", "credito"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPayment({ ...payment, tipoCartao: t })}
                      className={`border rounded py-2 ${payment.tipoCartao === t ? "bg-black text-white" : "bg-white"
                        }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>

                <input
                  placeholder="Maquininha (ex: Stone)"
                  className="w-full border rounded p-2 mt-2"
                  value={payment.maquininha}
                  onChange={(e) => setPayment({ ...payment, maquininha: e.target.value })}
                />
              </>
            )}

            {/* pix maquininha */}
            {payment.forma === "pix" && (
              <input
                placeholder="Maquininha / Pix"
                className="w-full border rounded p-2 mt-2"
                value={payment.maquininha}
                onChange={(e) => setPayment({ ...payment, maquininha: e.target.value })}
              />
            )}

            <button
              onClick={finalizarVenda}
              className="mt-4 w-full bg-green-700 text-white py-2 rounded font-bold"
            >
              Finalizar Venda
            </button>
          </div>

                  {/* 👉 aqui dentro você move o conteúdo do carrinho que já existe */}
                  {/* Por enquanto só pra testar: */}
                  <p className="text-sm text-gray-600">
                    Itens: <b>{cartCount}</b>
                  </p>

                  <div className="mt-3 font-bold">
                    Total: R$ {total().toFixed(2)}
                  </div>
                </div>
              </div>
            )}


      </div>

    
        {/* MODAL */}
{isModalOpen && selectedProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div className="bg-white w-full max-w-md rounded-xl text-black max-h-[85vh] flex flex-col overflow-hidden">
      
      {/* HEADER (fixo) */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">{selectedProduct.name}</h2>
          <button onClick={() => setIsModalOpen(false)}>✕</button>
        </div>

        <p className="mt-2">
          Preço base: R$ {Number(selectedProduct.price).toFixed(2)}
        </p>

        <h3 className="font-bold mt-3 text-center">Adicionais</h3>
      </div>

      {/* LISTA (com SCROLL) */}
        <div className="p-4 overflow-y-auto">
            {additionals.map((add) => {
              const selected = selectedAdditionals.find(
                (a) => a.additionalId === add.id
              );

                return (
                  <div
                    key={add.id}
                    className="flex justify-between items-center border p-2 mb-2 rounded"
                  >
                    <div>
                      <p className="font-medium">{add.name}</p>
                      <p className="text-sm">R$ {Number(add.price).toFixed(2)}</p>
                    </div>

                    {selected ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 border rounded"
                          onClick={() =>
                            setSelectedAdditionals((prev) =>
                              prev.map((a) =>
                                a.additionalId === add.id
                                  ? { ...a, quantity: a.quantity + 1 }
                                  : a
                              )
                            )
                          }
                        >
                          +
                        </button>

                        <span className="min-w-[20px] text-center">
                          {selected.quantity}
                        </span>

                      <button
                        className="
                          w-8 h-8
                          flex items-center justify-center
                          rounded-full
                          border
                          border-gray-300
                          text-gray-700
                          hover:bg-gray-100
                          active:bg-gray-200
                          active:scale-95
                          transition
                        "
                        onClick={() =>
                          setSelectedAdditionals((prev) =>
                            prev.filter((a) => a.additionalId !== add.id)
                          )
                        }
                      >
                        −
                      </button>

                      </div>
                    ) : (
                    <button
                      className="
                        px-3 py-1.5
                        rounded-lg
                        border
                        border-green-600
                        text-green-700
                        font-semibold
                        hover:bg-green-600
                        hover:text-white
                        active:bg-green-700
                        active:scale-95
                        transition
                      "
                      onClick={() =>
                        setSelectedAdditionals((prev) => [
                          ...prev,
                          {
                            additionalId: add.id,
                            name: add.name,
                            price: add.price,
                            quantity: 1,
                          },
                        ])
                      }
                    >
                      Adicionar
                    </button>

                    )}
                  </div>
                );
              })}
        </div>

          {/* FOOTER (fixo) */}
          <div className="p-4 border-t bg-white sticky bottom-0">
             <button
                  className="
                    w-full 
                    bg-green-600 
                    hover:bg-green-700 
                    active:bg-green-800
                    text-white 
                    font-extrabold 
                    py-3 
                    rounded-xl 
                    shadow-lg 
                    transition 
                    duration-150
                    flex 
                    items-center 
                    justify-center 
                    gap-2
                  "
                  onClick={() => {
                    addToCart({
                      ...selectedProduct,
                      additionals: selectedAdditionals,
                    });
                    setIsModalOpen(false);
                  }}
                >
                  🛒 Adicionar ao carrinho
             </button>

          </div>
        </div>
      </div>
    )}


      <div className="text-center mt-4">
        <a href="/admin" className="underline">
          ← Voltar
        </a>
      </div>
  

    </div>
  );
}
