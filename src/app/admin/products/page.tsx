"use client";

import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = async () => {
    const resProd = await fetch("/api/pdv");
    const productsData = await resProd.json();

    const resCat = await fetch("/api/categories");
    const categoriesData = await resCat.json();

    setProducts(productsData);
    setCategories(categoriesData);
  };

  const toggleActive = async (p: any) => {
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...p,
        active: !p.active,
      }),
    });

    loadData();
  };

  const removeProduct = async (id: number) => {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-red-600 p-6 text-white">

      <a
        href="/admin"
        className="inline-block mb-4 text-white bg-red-800 px-4 py-2 rounded-lg shadow hover:bg-red-900 transition"
      >
        ⬅ Voltar
      </a>

      <h1 className="text-3xl font-bold text-center mb-6">
        Produtos Cadastrados
      </h1>

      <div className="max-w-xl mx-auto flex justify-end mb-4">
        <a
          href="/admin/products/new"
          className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg shadow hover:bg-gray-200 transition"
        >
          ➕ Novo Produto
        </a>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {categories.map((cat: any) => {
          const filtered = products.filter((p: any) => p.categoryId === cat.id);

          if (filtered.length === 0) return null; // não exibe categoria vazia

          return (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-xl font-bold underline">{cat.name}</h2>

              {filtered.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white text-black p-4 rounded-lg shadow flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-sm text-gray-700">
                      R${Number(p.price).toFixed(2)}
                      {p.description ? ` — ${p.description}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-3 items-center">
                    {/* Editar */}
                    <a
                      href={`/admin/products/${p.id}`}
                      className="text-blue-600 font-bold"
                    >
                      ✏
                    </a>

                    {/* Ativo / Inativo */}
                    <button
                      onClick={() => toggleActive(p)}
                      className="font-bold"
                    >
                      {p.active ? (
                        <span className="text-green-600 text-xl">✔</span>
                      ) : (
                        <span className="text-yellow-600 text-xl">🚫</span>
                      )}
                    </button>

                    {/* Remover */}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="text-red-600 font-bold"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
