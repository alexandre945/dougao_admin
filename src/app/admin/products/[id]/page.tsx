"use client";

import { useEffect, useState } from "react";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [productId, setProductId] = useState<number | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState([]);

  // Desembrulhar params (é uma Promise no Next 15/16)
  useEffect(() => {
    const loadParams = async () => {
      const p = await params;
      setProductId(Number(p.id));
    };
    loadParams();
  }, [params]);

  // Buscar dados quando o ID estiver pronto
  useEffect(() => {
    if (productId !== null) {
      loadData(productId);
    }
  }, [productId]);

  const loadData = async (id: number) => {
    const resProduct = await fetch(`/api/products/${id}`);
    const prod = await resProduct.json();
    setProduct(prod);

    const resCat = await fetch("/api/categories");
    const cats = await resCat.json();
    setCategories(cats);
  };

  const handleUpdate = async () => {
    if (!product.name || !product.price || !product.categoryId) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const res = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        price: Number(product.price),
        categoryId: Number(product.categoryId),
        active: product.active,
      }),
    });

    if (res.ok) {
      alert("Produto atualizado!");
      window.location.href = "/admin/products";
    } else {
      alert("Erro ao atualizar.");
    }
  };

  if (!product) {
    return <div className="p-6 text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-red-600 p-6 text-white">
      <a
        href="/admin/products"
        className="inline-block mb-4 text-white bg-red-800 px-4 py-2 rounded-lg shadow hover:bg-red-900"
      >
        ⬅ Voltar
      </a>

      <h1 className="text-3xl font-bold text-center mb-6">Editar Produto</h1>

      <div className="bg-white text-black p-6 rounded-lg shadow-md space-y-4 max-w-md mx-auto">
        <input
          type="text"
          value={product.name}
          onChange={(e) =>
            setProduct({ ...product, name: e.target.value })
          }
          className="w-full p-3 rounded border"
          placeholder="Nome"
        />

        <textarea
          value={product.description ?? ""}
          onChange={(e) =>
            setProduct({ ...product, description: e.target.value })
          }
          className="w-full p-3 rounded border"
          placeholder="Descrição"
        />

        <input
          type="number"
          value={product.price}
          onChange={(e) =>
            setProduct({ ...product, price: e.target.value })
          }
          className="w-full p-3 rounded border"
          placeholder="Preço"
        />

        <select
          value={product.categoryId}
          onChange={(e) =>
            setProduct({ ...product, categoryId: Number(e.target.value) })
          }
          className="w-full p-3 rounded border"
        >
          <option value="">Selecione a categoria</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleUpdate}
          className="w-full bg-red-600 text-white font-bold p-3 rounded-lg hover:bg-red-700"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}
