import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { apiFetch } from './api';

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}

function formatarData(data) {
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function Despesas() {
  const { getToken } = useAuth();

  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje());
  const [categoriaId, setCategoriaId] = useState('');

  const [editando, setEditando] = useState(null);
  const [filtroMes, setFiltroMes] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregarCategorias() {
    try {
      const token = await getToken();
      const lista = await apiFetch('/api/categorias', token);
      setCategorias(lista);
      if (lista.length > 0 && !categoriaId) {
        setCategoriaId(lista[0].id);
      }
    } catch (e) {
      setErro(e.message);
    }
  }

  async function carregarDespesas() {
    setLoading(true);
    setErro('');
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (filtroMes) params.set('mes', filtroMes);
      const qs = params.toString();
      const lista = await apiFetch(`/api/despesas${qs ? `?${qs}` : ''}`, token);
      setDespesas(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarCategorias(); }, []);
  useEffect(() => { carregarDespesas(); }, [filtroMes]);

  function limparFormulario() {
    setDescricao('');
    setValor('');
    setData(hoje());
    setCategoriaId(categorias[0]?.id || '');
    setEditando(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (categorias.length === 0) {
      setErro('Crie uma categoria antes de cadastrar uma despesa.');
      return;
    }
    try {
      const token = await getToken();
      const body = {
        descricao: descricao.trim(),
        valor: Number(valor),
        data,
        categoria_id: categoriaId,
      };
      if (editando) {
        await apiFetch(`/api/despesas/${editando}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/despesas', token, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      limparFormulario();
      await carregarDespesas();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta despesa?')) return;
    setErro('');
    try {
      const token = await getToken();
      await apiFetch(`/api/despesas/${id}`, token, { method: 'DELETE' });
      await carregarDespesas();
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(d) {
    setEditando(d.id);
    setDescricao(d.descricao);
    setValor(String(d.valor));
    setData(d.data.slice(0, 10));
    setCategoriaId(d.categoria_id);
  }

  const totalFiltrado = despesas.reduce((acc, d) => acc + Number(d.valor), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Despesas</h2>
        <p className="text-sm text-gray-500">
          Registre seus gastos do dia a dia.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
          {erro}
        </div>
      )}

      {categorias.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4">
          ⚠️ Você ainda não tem categorias. Vá em "Categorias" e crie uma primeiro.
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center"
      >
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
          className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={categorias.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition"
        >
          {editando ? 'Salvar' : 'Adicionar'}
        </button>
        {editando && (
          <button
            type="button"
            onClick={limparFormulario}
            className="text-gray-500 hover:text-gray-900 text-sm"
          >
            Cancelar
          </button>
        )}
      </form>

      {/* Filtro + total */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-gray-500">Filtrar por mês:</label>
        <input
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filtroMes && (
          <button
            type="button"
            onClick={() => setFiltroMes('')}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Limpar
          </button>
        )}
        <span className="ml-auto text-lg font-bold text-gray-900">
          Total: <span className="text-red-600">{formatarValor(totalFiltrado)}</span>
        </span>
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {despesas.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="w-3 h-3 rounded"
              style={{ background: d.categoria_cor || '#888' }}
              title={d.categoria_nome}
            />
            <span className="flex-1 font-medium text-gray-900">{d.descricao}</span>
            <span className="w-28 text-right font-bold text-red-600">
              {formatarValor(d.valor)}
            </span>
            <span className="w-24 text-center text-sm text-gray-500">
              {formatarData(d.data)}
            </span>
            <span className="w-24 text-sm text-gray-600">
              {d.categoria_nome}
            </span>
            <button
              onClick={() => handleEdit(d)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(d.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Excluir
            </button>
          </div>
        ))}
        {!loading && despesas.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            Nenhuma despesa registrada.
          </p>
        )}
      </div>
    </div>
  );
}