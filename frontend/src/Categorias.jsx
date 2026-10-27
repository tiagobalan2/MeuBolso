import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { useAuth } from "@clerk/react";
export default function Categorias() {
  const { getToken } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3B82F6');
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const token = await getToken();
      const lista = await apiFetch('/api/categorias', token);
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
    setErro('');
    try {
      const token = await getToken();
      if (editando) {
        await apiFetch(`/api/categorias/${editando}`, token, {
          method: 'PUT',
          body: JSON.stringify({ nome, cor }),
        });
      } else {
        await apiFetch('/api/categorias', token, {
          method: 'POST',
          body: JSON.stringify({ nome, cor }),
        });
      }
      setNome('');
      setCor('#3B82F6');
      setEditando(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta categoria?')) return;
    setErro('');
    try {
      const token = await getToken();
      await apiFetch(`/api/categorias/${id}`, token, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleEdit(cat) {
    setEditando(cat.id);
    setNome(cat.nome);
    setCor(cat.cor || '#3B82F6');
  }

  return (
    <div>
      <h2>Minhas categorias</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Nome da categoria"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="color"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          title="Cor"
        />
        <button type="submit">{editando ? 'Salvar' : 'Adicionar'}</button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setNome(''); setCor('#3B82F6'); }}>
            Cancelar
          </button>
        )}
      </form>

      {loading && <p>Carregando...</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {categorias.map((c) => (
          <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #eee' }}>
            <span style={{ width: 16, height: 16, background: c.cor, borderRadius: 4 }} />
            <span style={{ flex: 1 }}>{c.nome}</span>
            <button onClick={() => handleEdit(c)}>Editar</button>
            <button onClick={() => handleDelete(c.id)}>Excluir</button>
          </li>
        ))}
        {!loading && categorias.length === 0 && <li>Nenhuma categoria ainda.</li>}
      </ul>
    </div>
  );
}