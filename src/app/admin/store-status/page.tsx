"use client";

import { useEffect, useState } from "react";

type StoreStatus = {
  isOpen: boolean;
  mode: "AUTO" | "MANUAL";
  message: string;
};

export default function StoreStatusToggle() {
  const [data, setData] = useState<StoreStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/store-status", { cache: "no-store" });
    const json = await res.json();
    setData(json);
  }

  async function toggle() {
    if (!data) return;
    setLoading(true);

    await fetch("/api/store-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: !data.isOpen }),
    });

    await loadStatus();
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (!data) return <p>Carregando status…</p>;

  return (
    <div className="max-w-sm rounded-xl mt-12 text-center pt-4 border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {data.isOpen ? "🟢 Aberta" : "🔴 Fechada"}
        </span>

        <button
          onClick={toggle}
          disabled={loading}
          className={`px-4 py-2 pt-4 mt-4 rounded-lg text-white font-medium ${
            data.isOpen ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {loading
            ? "Salvando…"
            : data.isOpen
            ? "Fechar agora"
            : "Abrir agora"}
        </button>
      </div>

      <p className="text-sm text-gray-600">{data.message}</p>
        <div className="text-center mt-4">
          <a href="/admin" className="underline">
            ← Voltar
          </a>
        </div>
    </div>
    
  );
}
