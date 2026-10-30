import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { apiFetch } from "./api";

export default function Categorias() {
  const { getToken } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3B82F6");
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const token = await getToken();
      const lista = await apiFetch("/api/categorias", token);
      setCategorias(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    try {
      const token = await getToken();
      if (editando) {
        await apiFetch(`/api/categorias/${editando}`, token, {
          method: "PUT",
          body: JSON.stringify({ nome, cor }),
        });
      } else {
        await apiFetch("/api/categorias", token, {
          method: "POST",
          body: JSON.stringify({ nome, cor }),
        });
      }
      setNome("");
      setCor("#3B82F6");
      setEditando(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta categoria?")) return;
    setErro("");
    try {
      const token = await getToken();
      await apiFetch(`/api/categorias/${id}`, token, { method: "DELETE" });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(cat) {
    setEditando(cat.id);
    setNome(cat.nome);
    setCor(cat.cor || "#3B82F6");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
          <p className="text-sm text-gray-500">
            Organize suas despesas por tipo de gasto.
          </p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
          {erro}
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center"
      >
        <input
          placeholder="Nome da categoria"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="color"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          title="Cor"
          className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          {editando ? "Salvar" : "Adicionar"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={() => {
              setEditando(null);
              setNome("");
              setCor("#3B82F6");
            }}
            className="text-gray-500 hover:text-gray-900 text-sm"
          >
            Cancelar
          </button>
        )}
      </form>

      {loading && <p className="text-gray-500">Carregando...</p>}

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {categorias.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-4 h-4 rounded" style={{ background: c.cor }} />
            <span className="flex-1 font-medium text-gray-900">{c.nome}</span>
            <button
              onClick={() => handleEdit(c)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Excluir
            </button>
          </div>
        ))}
        {!loading && categorias.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            Nenhuma categoria ainda. Crie a primeira acima.
          </p>
        )}
      </div>
    </div>
  );
}
