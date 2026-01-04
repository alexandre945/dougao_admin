import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  // 👉 senha fixa (depois você pode colocar no .env)
 const ADMIN_PASSWORD = process.env.PASSWORD_SECRET;

  

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  // 👉 cria cookie de sessão
  const res = NextResponse.json({ ok: true });

  res.cookies.set("admin-auth", "true", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 dia
  });

  return res;
}
