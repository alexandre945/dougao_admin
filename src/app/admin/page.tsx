export default function AdminPage() {
  return (
    <div className="min-h-screen bg-red-500 flex flex-col items-center justify-center p-6">
      <h1 className="text-white text-3xl font-extrabold mb-10 text-center">
        Painel Administrativo
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">

        <a
          href="/admin/products"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          📦Cadastro e Atualizações de Produtos
        </a>

        <a
          href="/admin/categories"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          🏷️ Categorias
        </a>

        <a
          href="/admin/additionals"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          🏷️Cadastro e atualizações de Adicionais
        </a>

        <a
          href="/admin/pdv"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          🏷️ Vendas
        </a>

        <a
          href="/admin/history"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          🏷️ Pedidos
        </a>

                <a
          href="/admin/store-status"
          className="bg-white text-red-600  font-bold py-4 rounded-lg shadow-md hover:scale-[1.02] transition-transform"
        >
          🏷️ Abrir Lanchonete Manualmente
        </a>
        

      </div>
    </div>
  );
}
