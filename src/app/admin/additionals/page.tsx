"use client";

import { useEffect, useState } from "react";

export default function AdditionalsPage() {
const [editingId, setEditingId] = useState<number | null>(null);
const [editName, setEditName] = useState("");
const [editPrice, setEditPrice] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [additionals, setAdditionals] = useState<any[]>([]);

  async function loadAdditionals() {
    const res = await fetch("/api/additionals");
    const data = await res.json();
    setAdditionals(data);
  }

  async function createAdditional(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/additionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
      }),
    });

    setName("");
    setPrice("");
    loadAdditionals();
  }

  async function removeAdditional(id: number) {
    if (!confirm("Excluir este adicional?")) return;

    await fetch(`/api/additionals/${id}`, {
      method: "DELETE",
    });

    loadAdditionals();
  }

  useEffect(() => {
    loadAdditionals();
  }, []);

  async function saveEdit(id: number) {
  await fetch(`/api/additionals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: editName,
      price: Number(editPrice),
    }),
  });

  setEditingId(null);
  loadAdditionals();
}


  return (
    <div className="min-h-screen bg-red-600 p-6 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">
        Adicionais
      </h1>

      {/* FORM */}
      <form
        onSubmit={createAdditional}
        className="bg-white text-black max-w-md mx-auto p-4 rounded-lg shadow mb-6 space-y-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do adicional"
          className="w-full border p-2 rounded"
          required
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço (ex: 2.00)"
          type="number"
          step="0.01"
          className="w-full border p-2 rounded"
          required
        />

        <button className="w-full bg-red-600 text-white font-bold py-2 rounded">
          Cadastrar adicional
        </button>
      </form>

      {/* LIST */}
      <div className="max-w-md mx-auto space-y-3">
        {additionals.map((a) => (
                <div
                    key={a.id}
                    className="bg-white text-black p-3 rounded flex justify-between items-center"
                >
                    <div className="flex-1">
                    {editingId === a.id ? (
                        <>
                        <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border p-1 rounded w-full mb-1"
                        />

                        <input
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            type="number"
                            step="0.01"
                            className="border p-1 rounded w-full"
                        />
                        </>
                    ) : (
                        <>
                        <p className="font-bold">{a.name}</p>
                        <p className="text-sm text-gray-600">
                            R$ {Number(a.price).toFixed(2)}
                        </p>
                        </>
                    )}
                    </div>

                    <div className="flex flex-row gap-3 ml-3">
                    {/* EDITAR */}
                    {editingId === a.id ? (
                        <>
                        <button
                            onClick={() => saveEdit(a.id)}
                            className="text-green-600 font-bold"
                        >
                            ✔
                        </button>

                        <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 font-bold"
                        >
                            ✖
                        </button>
                        </>
                    ) : (
                        <button
                        onClick={() => {
                            setEditingId(a.id);
                            setEditName(a.name);
                            setEditPrice(a.price);
                        }}
                        className="text-blue-600 font-bold"
                        >
                        ✏
                        </button>
                    )}

                    {/* ATIVAR / DESATIVAR */}
                    <button
                        onClick={async () => {
                        await fetch(`/api/additionals/${a.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                            name: a.name,
                            price: Number(a.price),
                            active: !a.active,
                            }),
                        });

                        loadAdditionals();
                        }}
                        className={`font-bold text-xl ${
                        a.active ? "text-green-600" : "text-gray-400"
                        }`}
                    >
                        {a.active ? "✔" : "🚫"}
                    </button>

                    {/* DELETE */}
                    <button
                        onClick={() => removeAdditional(a.id)}
                        className="text-red-600 font-bold"
                    >
                        🗑
                    </button>
                    </div>
                </div>
        ))}

      </div>

      <div className="text-center mt-6">
        <a href="/admin" className="underline">
          ← Voltar ao painel
        </a>
      </div>
    </div>
  );
}
