"use client";

import { useEffect, useMemo, useState } from "react";

type Summary = {
  day: string;
  tz: string;
  rangeBR: { start: string; end: string };
  totalOrders: number;
  totalValue: number;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n || 0);
}

// YYYY-MM-DD no fuso local do browser
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RelatoriosTurnoPage() {
  const [day, setDay] = useState<string>(() => todayISO());
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const titleRange = useMemo(() => {
    return "Turno 18:00 → 01:00";
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/order-admin/summary?day=${day}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao buscar resumo");
      const json = (await res.json()) as Summary;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Erro");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-end justify-between gap-3">
          <a
            href="/admin"
            className="inline-block mb-4 text-white bg-red-800 px-4 py-2 rounded-lg shadow hover:bg-red-900 transition"
          >
            ⬅ Voltar
          </a>
        <div>
          <h1 className="text-xl font-semibold">Relatório</h1>
          <p className="text-sm text-gray-500">{titleRange}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Dia:</label>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Total do turno</p>
          <button
            onClick={load}
            className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {err ? (
          <p className="mt-3 text-sm text-red-600">{err}</p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold">
              {formatBRL(data?.totalValue ?? 0)}
            </p>

            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="px-3 py-1 rounded-full bg-gray-100">
                Pedidos: <b className="text-gray-900">{data?.totalOrders ?? 0}</b>
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100">
                Janela:{" "}
                <b className="text-gray-900">
                  {data?.rangeBR?.start?.slice(11, 16)}–{data?.rangeBR?.end?.slice(11, 16)}
                </b>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
