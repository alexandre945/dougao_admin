"use client";

import { useEffect, useState } from "react";

type StoreStatus = {
  isOpen: boolean;
  message: string;
};

export default function Header() {
  const [status, setStatus] = useState<StoreStatus | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/store-status", { cache: "no-store" });
      const json = (await res.json()) as StoreStatus;
      setStatus(json);
    }
    load();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className=" top-0 left-0 right-0 z-999 bg-yellow-400 shadow">
      <div className="px-4 py-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-red-700">
          🍔 DOUGÃO LANCHES
        </h1>

        <div className="mt-3 flex gap-2 overflow-x-auto px-1 justify-start sm:justify-center">
          <button
            onClick={() => scrollTo("lanches")}
            className="shrink-0 bg-yellow-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
          >
            🍔 Lanches
          </button>

          <button
            onClick={() => scrollTo("combos")}
            className="shrink-0 bg-yellow-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
          >
            🍟 Combos
          </button>

          <button
            onClick={() => scrollTo("bebidas")}
            className="shrink-0 bg-yellow-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
          >
            🥤 Bebidas
          </button>

          <button
            onClick={() => scrollTo("bomboniere")}
            className="shrink-0 bg-yellow-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"
          >
            🍫 Bomboniere
          </button>
        </div>

        <p className="mt-3 text-sm font-medium text-gray-900">
          ⏰ Funcionamos das 19h às 23:30h — Terça a Domingo
        </p>

        <p className="text-sm text-gray-900">
          📍 Rua Batista Luzardo, 1005 — São Lourenço, MG
        </p>

        {/* ✅ Status dinâmico */}
        <p
          className={`mt-2 text-sm font-bold ${
            status?.isOpen ? "text-green-700" : "text-red-700"
          }`}
        >
          {status
            ? status.message
            : "Carregando status da lanchonete..."}
        </p>
      </div>
    </header>
  );
}
