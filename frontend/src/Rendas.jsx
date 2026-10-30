import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { apiFetch } from './api';

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}

function formatarMes(mesIso) {
  const [ano, m] = mesIso.slice(0, 7).split('-');
  const nomes = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${nomes[Number(m) - 1]}/${ano}`;
}

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

export default function Rendas() {
  const { getToken } = useAuth();
  const [rendas, setRendas] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [mes, setMes] = useState(mesAtual());
  const [editando, setEditando] = useState(null);
  const [filtroMes, setFiltroMes] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (filtroMes) params.set('mes', filtroMes);
      const qs = params.toString();
      const lista = await apiFetch(`/api/rendas${qs ? `?${qs}` : ''}`, token);
      setRendas(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [filtroMes]);

  function limparFormulario() {
    setDescricao('');
    setValor('');
    setMes(mesAtual());
    setEditando(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    try {
      const token = await getToken();
      const body = { descricao: descricao.trim(), valor: Number(valor), mes };
      if (editando) {
        await apiFetch(`/api/rendas/${editando}`, token, {
          method: 'PUT', body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/rendas', token, {
          method: 'POST', body: JSON.stringify(body),
        });
      }
      limparFormulario();
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta renda?')) return;
    setErro('');
    try {
      const token = await getToken();
      await apiFetch(`/api/rendas/${id}`, token, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(r) {
    setEditando(r.id);
    setDescricao(r.descricao);
    setValor(String(r.valor));
    setMes(r.mes.slice(0, 7));
  }

  const total = rendas.reduce((acc, r) => acc + Number(r.valor), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Renda</h2>
        <p className="text-sm text-gray-500">
          Cadastre quanto você recebe por mês (pode ter mais de uma fonte).
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center"
      >
        <input
          placeholder="Descrição (ex: Salário)"
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
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
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
          Total: <span className="text-green-600">{formatarValor(total)}</span>
        </span>
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {rendas.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 font-medium text-gray-900">{r.descricao}</span>
            <span className="w-32 text-right font-bold text-green-600">
              {formatarValor(r.valor)}
            </span>
            <span className="w-32 text-center text-sm text-gray-500">
              {formatarMes(r.mes)}
            </span>
            <button
              onClick={() => handleEdit(r)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Excluir
            </button>
          </div>
        ))}
        {!loading && rendas.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            Nenhuma renda cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}