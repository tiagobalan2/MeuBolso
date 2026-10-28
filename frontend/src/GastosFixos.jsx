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

  useEffect(() => {
    carregar();
  }, []);

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
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/gastos-fixos', token, {
          method: 'POST',
          body: JSON.stringify(body),
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
      <h2>Gastos fixos</h2>
      <p style={{ color: '#666', fontSize: 14 }}>
        Despesas recorrentes (aluguel, internet, assinaturas) que se repetem todo mês.
      </p>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
      >
        <input
          placeholder="Descrição (ex: Aluguel)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          style={{ flex: '1 1 200px' }}
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          style={{ width: 120 }}
        />
        <input
          type="number"
          min="1"
          max="31"
          placeholder="Dia venc."
          value={diaVencimento}
          onChange={(e) => setDiaVencimento(e.target.value)}
          style={{ width: 100 }}
        />
        <button type="submit">{editando ? 'Salvar' : 'Adicionar'}</button>
        {editando && (
          <button type="button" onClick={limparFormulario}>
            Cancelar
          </button>
        )}
      </form>

      <div style={{ marginBottom: 12, fontWeight: 'bold' }}>
        Total mensal (ativos): {formatarValor(totalAtivos)}
      </div>

      {loading && <p>Carregando...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {gastos.map((g) => (
          <li
            key={g.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              borderBottom: '1px solid #eee',
              opacity: g.ativo ? 1 : 0.5,
            }}
          >
            <span style={{ flex: 1 }}>
              {g.descricao}
              {g.dia_vencimento && (
                <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>
                  (vence dia {g.dia_vencimento})
                </span>
              )}
            </span>
            <span style={{ width: 120, textAlign: 'right', color: '#dc2626', fontWeight: 'bold' }}>
              {formatarValor(g.valor)}
            </span>
            <button onClick={() => handleToggleAtivo(g)}>
              {g.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button onClick={() => handleEdit(g)}>Editar</button>
            <button onClick={() => handleDelete(g.id)}>Excluir</button>
          </li>
        ))}
        {!loading && gastos.length === 0 && <li>Nenhum gasto fixo cadastrado.</li>}
      </ul>
    </div>
  );
}