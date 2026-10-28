import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { apiFetch } from './api';

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

function formatarMes(mes) {
  const [ano, m] = mes.split('-');
  const nomes = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${nomes[Number(m) - 1]}/${ano}`;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const [mes, setMes] = useState(mesAtual());
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro('');
    try {
      const token = await getToken();
      const data = await apiFetch(`/api/dashboard/resumo?mes=${mes}`, token);
      setResumo(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [mes]);

  const maiorCategoria = resumo?.porCategoria?.[0];
  const saldo = resumo?.saldo ?? 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div>
      <h2>Resumo do mês</h2>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <div style={{ marginBottom: 16 }}>
        <label>Mês: </label>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        />
      </div>

      {loading && <p>Carregando...</p>}

      {resumo && (
        <>
          {/* Cards principais */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <Card titulo="Renda" valor={formatarValor(resumo.renda.total)} cor="#16a34a" />
            <Card titulo="Gastos fixos" valor={formatarValor(resumo.gastosFixos.total)} cor="#dc2626" />
            <Card titulo="Despesas" valor={formatarValor(resumo.total)} cor="#ea580c" />
          </div>

          {/* Saldo em destaque */}
          <div
            style={{
              padding: 20,
              borderRadius: 8,
              marginBottom: 24,
              background: saldoPositivo ? '#ecfdf5' : '#fef2f2',
              border: `2px solid ${saldoPositivo ? '#16a34a' : '#dc2626'}`,
            }}
          >
            <div style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
              Saldo do mês (renda − gastos fixos − despesas)
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: saldoPositivo ? '#16a34a' : '#dc2626',
              }}
            >
              {formatarValor(saldo)}
            </div>
            {!saldoPositivo && (
              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>
                ⚠️ Você está gastando mais do que ganha neste mês.
              </div>
            )}
          </div>

          {/* Info extra */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Card titulo="Nº de despesas" valor={String(resumo.quantidade)} />
            <Card
              titulo="Categoria que mais gastou"
              valor={maiorCategoria ? maiorCategoria.nome : '—'}
            />
            <Card
              titulo="Rendas cadastradas"
              valor={String(resumo.renda.quantidade)}
            />
          </div>

          {/* Por categoria */}
          <h3>Gastos por categoria</h3>
          {resumo.porCategoria.length === 0 ? (
            <p>Nenhuma categoria cadastrada.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {resumo.porCategoria.map((c) => {
                const pct = resumo.total > 0 ? (c.total / resumo.total) * 100 : 0;
                return (
                  <li
                    key={c.id}
                    style={{
                      marginBottom: 12,
                      padding: 8,
                      border: '1px solid #eee',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            background: c.cor,
                            borderRadius: 3,
                            marginRight: 8,
                          }}
                        />
                        {c.nome}
                      </span>
                      <span>
                        {formatarValor(c.total)}{' '}
                        <span style={{ color: '#888', fontSize: 12 }}>({c.quantidade}x)</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c.cor }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Evolução */}
          <h3 style={{ marginTop: 32 }}>Últimos 6 meses (despesas)</h3>
          {resumo.evolucao.length === 0 ? (
            <p>Sem dados nos últimos 6 meses.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {resumo.evolucao.map((e) => (
                <li
                  key={e.mes}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 6,
                    borderBottom: '1px solid #eee',
                    color: e.mes === mes ? '#3B82F6' : 'inherit',
                    fontWeight: e.mes === mes ? 'bold' : 'normal',
                  }}
                >
                  <span>{formatarMes(e.mes)}</span>
                  <span>{formatarValor(e.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Card({ titulo, valor, destaque = false, cor = null }) {
  return (
    <div
      style={{
        flex: '1 1 160px',
        padding: 16,
        border: '1px solid #eee',
        borderRadius: 8,
        background: destaque ? '#eff6ff' : '#fafafa',
      }}
    >
      <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}>{titulo}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: cor || (destaque ? '#1d4ed8' : '#111'),
        }}
      >
        {valor}
      </div>
    </div>
  );
}