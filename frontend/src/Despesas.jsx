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
  // data vem como "2026-10-27" ou ISO
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
      // Se ainda não escolheu categoria, escolhe a primeira
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

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    carregarDespesas();
  }, [filtroMes]);

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
      <h2>Minhas despesas</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {categorias.length === 0 && (
        <p style={{ color: '#b45309' }}>
          ⚠️ Você ainda não tem categorias. Vá em "Categorias" e crie uma primeiro.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
      >
        <input
          placeholder="Descrição"
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
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          style={{ width: 150 }}
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
          style={{ width: 160 }}
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button type="submit" disabled={categorias.length === 0}>
          {editando ? 'Salvar' : 'Adicionar'}
        </button>
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
          Total: {formatarValor(totalFiltrado)}
        </span>
      </div>

      {loading && <p>Carregando...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {despesas.map((d) => (
          <li
            key={d.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              borderBottom: '1px solid #eee',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                background: d.categoria_cor || '#888',
                borderRadius: 3,
              }}
              title={d.categoria_nome}
            />
            <span style={{ flex: 1 }}>{d.descricao}</span>
            <span style={{ width: 110, textAlign: 'right' }}>
              {formatarValor(d.valor)}
            </span>
            <span style={{ width: 100, textAlign: 'center' }}>
              {formatarData(d.data)}
            </span>
            <span style={{ width: 100, color: '#666', fontSize: 14 }}>
              {d.categoria_nome}
            </span>
            <button onClick={() => handleEdit(d)}>Editar</button>
            <button onClick={() => handleDelete(d.id)}>Excluir</button>
          </li>
        ))}
        {!loading && despesas.length === 0 && <li>Nenhuma despesa registrada.</li>}
      </ul>
    </div>
  );
}