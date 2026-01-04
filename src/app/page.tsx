"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      alert("Senha incorreta!");
    }
  };

  return (
    <div className="min-h-screen bg-red-600 p-6 flex items-center justify-center">
      <div className="bg-white text-black p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        
        <h1 className="text-2xl font-bold text-center">
          Painel Administrativo
        </h1>

        <input
          type="password"
          placeholder="Digite a senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded border"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-red-600 text-white font-bold p-3 rounded-lg hover:bg-red-700"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
