"use client";

import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  return (
    <div className="min-h-screen bg-red-600 p-6 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">
        Categorias
      </h1>

      <div className="max-w-md mx-auto space-y-3">
        {categories.length === 0 && (
          <p className="text-center">Nenhuma categoria cadastrada</p>
        )}

        {categories.map((c) => (
          <div
            key={c.id}
            className="bg-white text-black p-4 rounded-lg shadow"
          >
            <p className="font-bold text-lg">
              {c.id}. {c.name}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <a
          href="/admin"
          className="underline text-white"
        >
          ← Voltar
        </a>
      </div>
    </div>
  );
}
