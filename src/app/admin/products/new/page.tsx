"use client";

import { useEffect, useState } from "react";

export default function NewProductPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar categorias
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId)
      return alert("Preencha os campos obrigatórios!");

    setLoading(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
      }),
    });

    setLoading(false);

    if (res.ok) {
      alert("Produto cadastrado com sucesso!");
      window.location.href = "/admin/products";
    } else {
      alert("Erro ao cadastrar produto!");
    }
  };

  return (
    <div className="min-h-screen bg-red-600 p-6 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">Novo Produto</h1>

      <div className="bg-white text-black p-6 rounded-lg shadow-md space-y-4 max-w-md mx-auto">

        <input
          type="text"
          name="name"
          placeholder="Nome do produto"
          onChange={handleChange}
          className="w-full p-3 rounded border"
        />

        <textarea
          name="description"
          placeholder="Descrição (opcional)"
          onChange={handleChange}
          className="w-full p-3 rounded border"
        />

        <input
          type="number"
          name="price"
          step="0.01"
          placeholder="Preço"
          onChange={handleChange}
          className="w-full p-3 rounded border"
        />

        <select
          name="categoryId"
          onChange={handleChange}
          className="w-full p-3 rounded border"
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-600 text-white font-bold p-3 rounded-lg hover:bg-red-700 transition"
        >
          {loading ? "Salvando..." : "Salvar Produto"}
        </button>
      </div>
    </div>
  );
}
