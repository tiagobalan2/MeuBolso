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
  // "2026-10-01" ou "2026-10" → "outubro/2026"
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

  useEffect(() => {
    carregar();
  }, [filtroMes]);

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
      const body = {
        descricao: descricao.trim(),
        valor: Number(valor),
        mes,
      };

      if (editando) {
        await apiFetch(`/api/rendas/${editando}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/api/rendas', token, {
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
      <h2>Minhas rendas</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
      >
        <input
          placeholder="Descrição (ex: Salário)"
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
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          required
          style={{ width: 150 }}
        />
        <button type="submit">{editando ? 'Salvar' : 'Adicionar'}</button>
        {editando && (
          <button type="button" onClick={limparFormulario}>
            Cancelar
          </button>
        )}
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <label>Filtrar por mês:</label>
        <input
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
        />
        {filtroMes && (
          <button type="button" onClick={() => setFiltroMes('')}>
            Limpar
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
          Total: {formatarValor(total)}
        </span>
      </div>

      {loading && <p>Carregando...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rendas.map((r) => (
          <li
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ flex: 1 }}>{r.descricao}</span>
            <span style={{ width: 120, textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>
              {formatarValor(r.valor)}
            </span>
            <span style={{ width: 140, textAlign: 'center', color: '#666' }}>
              {formatarMes(r.mes)}
            </span>
            <button onClick={() => handleEdit(r)}>Editar</button>
            <button onClick={() => handleDelete(r.id)}>Excluir</button>
          </li>
        ))}
        {!loading && rendas.length === 0 && <li>Nenhuma renda cadastrada.</li>}
      </ul>
    </div>
  );
}