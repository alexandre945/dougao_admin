"use client";

import Header from "../header/page";
import { useEffect, useMemo, useState } from "react";

type AdditionalSelected = {
  additionalId: number;
  name: string;
  price: number;
  quantity: number;
};

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  additionals: AdditionalSelected[];
};

function ProductCard({
  title,
  name,
  description,
  price,
  onAdd,
}: {
  title: string;
  name: string;
  description?: string;
  price: number;
  onAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border p-3 flex items-start justify-between gap-3 shadow-sm">
      <div className="min-w-0">
        <p className="font-extrabold text-sm text-gray-500">{title}</p>
        <p className="font-extrabold text-base text-gray-900">{name}</p>
        {description ? (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        ) : null}

        <p className="mt-2 font-bold text-gray-900">
          R$ {Number(price).toFixed(2).replace(".", ",")}
        </p>
      </div>

      <button
        onClick={onAdd}
        className="shrink-0 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center shadow active:scale-95"
        aria-label="Adicionar"
        title="Adicionar"
      >
        ➕
      </button>
    </div>
  );
}

export default function VendaPage() {
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
  const [categories, setCategories] = useState<any[]>([]);
  const [additionals, setAdditionals] = useState<any[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedAdditionals, setSelectedAdditionals] = useState<
    AdditionalSelected[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // carrinho flutuante (FAB + drawer)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const DELIVERY_FEE = 7;

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

  function updateCustomer(field: string, value: string) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  // 🔹 BUSCAR PRODUTOS
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
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
        if (Array.isArray(data)) setAdditionals(data.filter((a: any) => a.active));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Erro adicionais:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  // --- carrinho: funções por índice (evita bug com mesmo productId duplicado)
  function addToCart(product: any, addList: AdditionalSelected[] = []) {
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        additionals: addList,
      },
    ]);
  }

  function increaseAt(index: number) {
    setCart((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: it.quantity + 1 } : it))
    );
  }

  function decreaseAt(index: number) {
    setCart((prev) =>
      prev
        .map((it, i) => (i === index ? { ...it, quantity: it.quantity - 1 } : it))
        .filter((it) => it.quantity > 0)
    );
  }

  function removeAt(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  // subtotal/total igual à lógica do cliente (adicionais somam 1x por item no carrinho)
  const subtotalValue = useMemo(() => {
    return cart.reduce((sum, item) => {
      const adds = (item.additionals || []).reduce(
        (a, ad) => a + Number(ad.price) * Number(ad.quantity),
        0
      );
      return sum + Number(item.price) * Number(item.quantity) + adds;
    }, 0);
  }, [cart]);

  const totalValue = useMemo(() => {
    const fee = customer.tipoPedido === "entrega" ? DELIVERY_FEE : 0;
    return subtotalValue + fee;
  }, [customer.tipoPedido, subtotalValue]);

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

    // validações de pagamento
    if (payment.forma === "dinheiro" && !payment.trocoPara) {
      if (!confirm("Pagamento em dinheiro sem troco, confirma?")) return;
    }

    if (payment.forma === "cartao" && !payment.tipoCartao) {
      alert("Selecione débito ou crédito");
      return;
    }

    const customerPayload = buildCustomerPayload();

    // validações mínimas
      if (customerPayload.type === "ENTREGA") {
        if (!customerPayload.address?.street || !customerPayload.address?.bairro) {
          alert("Entrega exige Rua e Bairro.");
          return;
        }
    
      }
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

    const payload = {
      origin: "PDV_ADMIN",
      items: cart,
      total: totalValue,
      customer: customerPayload,
      payment,
    };

    try {
      const res = await fetch("/api/order-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Erro ao salvar pedido:", data);
        alert(data?.error || "Erro ao salvar pedido");
        return;
      }

      // limpa estados
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

      setPayment({
        forma: "dinheiro",
        tipoCartao: "",
        trocoPara: "",
        maquininha: "",
      });

      setIsCartOpen(false);

      alert(`Pedido #${data.orderId} salvo com sucesso`);
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    }
  }

  // categorias no layout do cliente (fixas)
  const lanches = products.filter(
    (p: any) => p.active && p.category?.name === "Lanches"
  );
  const combos = products.filter(
    (p: any) => p.active && p.category?.name === "Combos"
  );
  const bebidas = products.filter(
    (p: any) => p.active && p.category?.name === "Bebidas"
  );
  const bomboniere = products.filter(
    (p: any) => p.active && p.category?.name === "Bomboniere"
  );

  // fallback: se no admin tiver outras categorias, não some “do nada”
  const otherCategoryNames = useMemo(() => {
    const fixed = new Set(["Lanches", "Combos", "Bebidas", "Bomboniere"]);
    return (categories || [])
      .map((c: any) => c?.name)
      .filter((n: string) => n && !fixed.has(n));
  }, [categories]);

  function onAddProduct(p: any) {
    const categoryName = (p.category?.name || "").toLowerCase();

    if (categoryName === "lanches") {
      setSelectedProduct(p);
      setSelectedAdditionals([]);
      setIsModalOpen(true);
      return;
    }

    // outras categorias: entra direto
    addToCart(p, []);
  }

  return (
    <>
      <Header />
      {/* Se você quiser banner de status no admin também:
          <StoreStatusBanner /> (cria o componente aí, igual no cliente)
      */}

      <main className="min-h-screen bg-yellow-50 text-gray-900 pt-8 px-4 pb-40 space-y-8">
        {/* 🍔 Lanches */}
        <section id="lanches">
          <h2 className="text-xl text-center font-extrabold text-red-700 mb-3">
            🍔 Lanches
          </h2>
          <div className="space-y-3">
            {lanches.map((item: any, index: number) => (
              <ProductCard
                key={item.id}
                title={`${index + 1}.`}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                onAdd={() => onAddProduct(item)}
              />
            ))}
          </div>
        </section>

        {/* 🍟 Combos */}
        <section id="combos">
          <h2 className="text-xl text-center font-extrabold text-red-700 mb-3">
            🍟 Combos
          </h2>
          <div className="space-y-3">
            {combos.map((item: any, index: number) => (
              <ProductCard
                key={item.id}
                title={`${index + 1}.`}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                onAdd={() => onAddProduct(item)}
              />
            ))}
          </div>
        </section>

        {/* 🥤 Bebidas */}
        <section id="bebidas">
          <h2 className="text-xl text-center font-extrabold text-red-700 mb-3">
            🥤 Bebidas
          </h2>
          <div className="space-y-3">
            {bebidas.map((item: any, index: number) => (
              <ProductCard
                key={item.id}
                title={`${index + 1}.`}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                onAdd={() => onAddProduct(item)}
              />
            ))}
          </div>
        </section>

        {/* 🍫 Bomboniere */}
        <section id="bomboniere">
          <h2 className="text-xl text-center font-extrabold text-red-700 mb-3">
            🍫 Bomboniere
          </h2>
          <div className="space-y-3">
            {bomboniere.map((item: any, index: number) => (
              <ProductCard
                key={item.id}
                title={`${index + 1}.`}
                name={item.name}
                description={item.description}
                price={Number(item.price)}
                onAdd={() => onAddProduct(item)}
              />
            ))}
          </div>
        </section>

        {/* Outras categorias (se existirem) */}
        {otherCategoryNames.map((catName: string) => {
          const list = products.filter(
            (p: any) => p.active && p.category?.name === catName
          );
          if (list.length === 0) return null;

          return (
            <section
              key={catName}
              id={catName.toLowerCase().replace(/\s+/g, "")}
            >
              <h2 className="text-xl text-center font-extrabold text-red-700 mb-3">
                {catName}
              </h2>
              <div className="space-y-3">
                {list.map((item: any, index: number) => (
                  <ProductCard
                    key={item.id}
                    title={`${index + 1}.`}
                    name={item.name}
                    description={item.description}
                    price={Number(item.price)}
                    onAdd={() => onAddProduct(item)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* 🛒 FAB */}
        {itemsCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-4 right-4 z-[999] bg-black text-white w-14 h-14 rounded-full
                      flex items-center justify-center shadow-lg"
            aria-label="Abrir carrinho"
          >
            <span className="text-xl">🛒</span>
            <span
              className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold
                            w-6 h-6 rounded-full flex items-center justify-center"
            >
              {itemsCount}
            </span>
          </button>
        )}

        {/* Drawer carrinho */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[1000] bg-black/50 flex items-end sm:items-center justify-center">
            <div
              className="bg-white w-full sm:max-w-md h-[90vh] sm:h-[85vh]
                            rounded-t-2xl sm:rounded-2xl p-4 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">🛒 Seu pedido</h3>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-red-600 font-semibold"
                >
                  Fechar
                </button>
              </div>

              {cart.map((item, index) => (
                <div key={index} className="mb-3 border-b pb-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      ({item.quantity}) - {item.name}
                    </span>

                    <button
                      onClick={() => removeAt(index)}
                      className="text-red-600 text-xs"
                    >
                      Remover
                    </button>
                  </div>

                  {/* Adicionais */}
                  {item.additionals?.length > 0 && (
                    <ul className="ml-3 text-gray-600">
                      <p className="font-semibold text-gray-700">Adicionais</p>
                      {item.additionals.map((a) => (
                        <li key={`${a.additionalId}-${a.name}`}>
                          + ({a.quantity}) - {a.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* controles (igual ao admin original, mas mais clean) */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => decreaseAt(index)}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center"
                      title="Diminuir"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseAt(index)}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center"
                      title="Aumentar"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {/* totais */}
              {cart.length > 0 && (
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      R$ {subtotalValue.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {customer.tipoPedido === "entrega" && (
                    <div className="flex justify-between">
                      <span>Taxa de entrega</span>
                      <span>
                        R$ {DELIVERY_FEE.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total</span>
                    <span>R$ {totalValue.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              )}

              {/* 🧾 DADOS DO PEDIDO (layout do cliente + 3 tipos) */}
              {cart.length > 0 && (
                <div className="mt-4 space-y-3">
                  {/* Tipo do pedido */}
                  <div>
                    <p className="font-semibold text-sm mb-1">Tipo do pedido</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTipoPedido("balcao")}
                        className={`flex-1 border py-2 rounded ${
                          customer.tipoPedido === "balcao"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Balcão
                      </button>
                      <button
                        onClick={() => setTipoPedido("retirada")}
                        className={`flex-1 border py-2 rounded ${
                          customer.tipoPedido === "retirada"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Retirada
                      </button>
                      <button
                        onClick={() => setTipoPedido("entrega")}
                        className={`flex-1 border py-2 rounded ${
                          customer.tipoPedido === "entrega"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Entrega
                      </button>
                    </div>
                  </div>

                  {/* Nome */}
                  <div>
                    <p className="font-semibold text-sm mb-1">Nome</p>
                    <input
                      value={customer.nome}
                      onChange={(e) => updateCustomer("nome", e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      placeholder={
                        customer.tipoPedido === "balcao"
                          ? "Opcional (Balcão)"
                          : "Ex: Alexandre"
                      }
                    />
                  </div>

                  {/* Balcão: mesa */}
                  {customer.tipoPedido === "balcao" && (
                    <div>
                      <p className="font-semibold text-sm mb-1">Mesa</p>
                      <input
                        value={customer.mesa}
                        onChange={(e) => updateCustomer("mesa", e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Ex: 12"
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  {/* Retirada/Entrega: whatsapp */}
                  {customer.tipoPedido !== "balcao" && (
                    <div>
                      <p className="font-semibold text-sm mb-1">WhatsApp</p>
                      <input
                        value={customer.whatsapp}
                        onChange={(e) =>
                          updateCustomer("whatsapp", e.target.value)
                        }
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Ex: 9 98452-1234"
                      />
                    </div>
                  )}

                  {/* Observação */}
                  <div>
                    <p className="font-semibold text-sm mb-1">Observação</p>
                    <input
                      value={customer.observacao}
                      onChange={(e) =>
                        setCustomer({ ...customer, observacao: e.target.value })
                      }
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Ex: sem cebola, chamar no portão..."
                    />
                  </div>

                  {/* Campos de entrega */}
                  {customer.tipoPedido === "entrega" && (
                    <div className="space-y-2">
                      <div>
                      <p className="font-semibold text-sm mb-1">Rua</p>
                      <input
                        value={customer.rua}
                        onChange={(e) => updateCustomer("rua", e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Ex: Rua Carlos de Andrade e numero:21"
                      />
                   
                      </div>

                      <div className="grid grid-cols-2 gap-2">

                        <div>
                          <p className="font-semibold text-sm mb-1">Bairro</p>
                          <input
                            value={customer.bairro}
                            onChange={(e) =>
                              updateCustomer("bairro", e.target.value)
                            }
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Bairro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-semibold text-sm mb-1">
                            Complemento
                          </p>
                          <input
                            value={customer.complemento}
                            onChange={(e) =>
                              updateCustomer("complemento", e.target.value)
                            }
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Apto, bloco..."
                          />
                        </div>

                        <div>
                          <p className="font-semibold text-sm mb-1">Referência</p>
                          <input
                            value={customer.referencia}
                            onChange={(e) =>
                              updateCustomer("referencia", e.target.value)
                            }
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Perto de..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagamento (layout do cliente) */}
                  <div>
                    <p className="font-semibold text-sm mb-1">Pagamento</p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPayment({
                            forma: "dinheiro",
                            tipoCartao: "",
                            trocoPara: "",
                            maquininha: "",
                          })
                        }
                        className={`flex-1 border py-2 rounded ${
                          payment.forma === "dinheiro"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Dinheiro
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPayment({
                            forma: "cartao",
                            tipoCartao: "",
                            trocoPara: "",
                            maquininha: "",
                          })
                        }
                        className={`flex-1 border py-2 rounded ${
                          payment.forma === "cartao"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Cartão
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPayment({
                            forma: "pix",
                            tipoCartao: "",
                            trocoPara: "",
                            maquininha: "",
                          })
                        }
                        className={`flex-1 border py-2 rounded ${
                          payment.forma === "pix"
                            ? "bg-indigo-600 border-indigo-600 text-white shadow"
                            : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        Pix
                      </button>
                    </div>

                    {/* Dinheiro: troco */}
                    {payment.forma === "dinheiro" && (
                      <div className="mt-2">
                        <input
                          type="number"
                          placeholder="Troco para quanto? (vazio = sem troco)"
                          className="w-full border rounded p-2 text-sm"
                          value={payment.trocoPara}
                          onChange={(e) =>
                            setPayment({ ...payment, trocoPara: e.target.value })
                          }
                        />
                      </div>
                    )}

                    {/* Cartão: débito/crédito + maquininha */}
                    {payment.forma === "cartao" && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPayment({ ...payment, tipoCartao: "debito" })
                            }
                            className={`flex-1 border py-2 rounded ${
                              payment.tipoCartao === "debito"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow"
                                : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                            }`}
                          >
                            Débito
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPayment({ ...payment, tipoCartao: "credito" })
                            }
                            className={`flex-1 border py-2 rounded ${
                              payment.tipoCartao === "credito"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow"
                                : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                            }`}
                          >
                            Crédito
                          </button>
                        </div>

                        <input
                          placeholder="Maquininha (ex: Stone)"
                          className="w-full border rounded p-2 text-sm"
                          value={payment.maquininha}
                          onChange={(e) =>
                            setPayment({ ...payment, maquininha: e.target.value })
                          }
                        />
                      </div>
                    )}

                    {/* Pix: maquininha */}
                    {payment.forma === "pix" && (
                      <div className="mt-2">
                        <input
                          placeholder="Maquininha / Pix"
                          className="w-full border rounded p-2 text-sm"
                          value={payment.maquininha}
                          onChange={(e) =>
                            setPayment({ ...payment, maquininha: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={finalizarVenda}
                    className="mt-2 w-full bg-green-600 text-white py-3 rounded font-bold"
                  >
                    Finalizar Venda
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL (mantido do admin: adicionais só nos lanches) */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3">
          <div className="bg-white w-full max-w-md rounded-xl text-black max-h-[85vh] flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="p-4 border-b bg-white">
              <div className="flex justify-between items-center">
                <h2 className="font-bold">{selectedProduct.name}</h2>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition"
                >
                  ✕
                </button>
              </div>

              <p className="mt-2">
                Preço base: R$ {Number(selectedProduct.price).toFixed(2)}
              </p>

              <h3 className="font-bold mt-3 text-center">Adicionais</h3>
            </div>

            {/* LISTA */}
            <div className="p-4 flex-1 overflow-y-auto">
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
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 active:scale-95 transition"
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

                        <span className="min-w-[20px] text-center font-bold">
                          {selected.quantity}
                        </span>

                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-95 transition"
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
                        className="px-3 py-1.5 rounded-lg border border-green-600 text-green-700 font-semibold hover:bg-green-600 hover:text-white active:bg-green-700 active:scale-95 transition"
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

            {/* FOOTER */}
            <div className="p-4 border-t bg-white">
              <button
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-extrabold py-3 rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2"
                onClick={() => {
                  addToCart(selectedProduct, selectedAdditionals);
                  setIsModalOpen(false);
                }}
              >
                🛒 Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-4 pb-8">
        <a href="/admin" className="underline">
          ← Voltar
        </a>
      </div>
    </>
  );
}
