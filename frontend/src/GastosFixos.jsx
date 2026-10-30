import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { apiFetch } from './api';

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}

export default function GastosFixos() {
  const { getToken } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const token = await getToken();
      const lista = await apiFetch('/api/gastos-fixos', token);
      setGastos(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function limparFormulario() {
    setDescricao('');
    setValor('');
    setDiaVencimento('');
    setEditando(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    try {
      const token = await getToken();
      const body = {
        descricao: descricao.trim(),
        valor: Number(valor),
        dia_vencimento: diaVencimento ? Number(diaVencimento) : null,
      };
      if (editando) {
        await apiFetch(`/api/gastos-fixos/${editando}`, token, {
          method: 'PUT', body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/gastos-fixos', token, {
          method: 'POST', body: JSON.stringify(body),
        });
      }
      limparFormulario();
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleToggleAtivo(g) {
    setErro('');
    try {
      const token = await getToken();
      await apiFetch(`/api/gastos-fixos/${g.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !g.ativo }),
      });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este gasto fixo?')) return;
    setErro('');
    try {
      const token = await getToken();
      await apiFetch(`/api/gastos-fixos/${id}`, token, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(g) {
    setEditando(g.id);
    setDescricao(g.descricao);
    setValor(String(g.valor));
    setDiaVencimento(g.dia_vencimento ? String(g.dia_vencimento) : '');
  }

  const totalAtivos = gastos
    .filter((g) => g.ativo)
    .reduce((acc, g) => acc + Number(g.valor), 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gastos fixos</h2>
        <p className="text-sm text-gray-500">
          Despesas recorrentes (aluguel, internet, assinaturas).
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
          placeholder="Descrição (ex: Aluguel)"
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
          type="number"
          min="1"
          max="31"
          placeholder="Dia venc."
          value={diaVencimento}
          onChange={(e) => setDiaVencimento(e.target.value)}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="mb-4 text-lg font-bold text-gray-900">
        Total mensal (ativos): <span className="text-red-600">{formatarValor(totalAtivos)}</span>
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {gastos.map((g) => (
          <div
            key={g.id}
            className={`flex items-center gap-3 px-4 py-3 ${g.ativo ? '' : 'opacity-50'}`}
          >
            <span className="flex-1 font-medium text-gray-900">
              {g.descricao}
              {g.dia_vencimento && (
                <span className="text-gray-400 text-sm ml-2">
                  (vence dia {g.dia_vencimento})
                </span>
              )}
            </span>
            <span className="w-32 text-right font-bold text-red-600">
              {formatarValor(g.valor)}
            </span>
            <button
              onClick={() => handleToggleAtivo(g)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {g.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => handleEdit(g)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(g.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Excluir
            </button>
          </div>
        ))}
        {!loading && gastos.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            Nenhum gasto fixo cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}