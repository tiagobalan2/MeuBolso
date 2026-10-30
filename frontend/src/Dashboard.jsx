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

  useEffect(() => { carregar(); }, [mes]);

  const maiorCategoria = resumo?.porCategoria?.[0];
  const saldo = resumo?.saldo ?? 0;
  const saldoPositivo = saldo >= 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Resumo do mês</p>
        </div>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
          {erro}
        </div>
      )}

      {loading && <p className="text-gray-500">Carregando...</p>}

      {resumo && (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card
              titulo="Renda"
              valor={formatarValor(resumo.renda.total)}
              corTexto="text-green-600"
            />
            <Card
              titulo="Gastos fixos"
              valor={formatarValor(resumo.gastosFixos.total)}
              corTexto="text-red-600"
            />
            <Card
              titulo="Despesas"
              valor={formatarValor(resumo.total)}
              corTexto="text-orange-600"
            />
          </div>

          {/* Saldo em destaque */}
          <div
            className={`rounded-xl p-6 mb-6 border-2 ${
              saldoPositivo
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="text-sm text-gray-600 mb-1">
              Saldo do mês (renda − gastos fixos − despesas)
            </div>
            <div
              className={`text-4xl font-bold ${
                saldoPositivo ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatarValor(saldo)}
            </div>
            {!saldoPositivo && (
              <div className="text-sm text-red-600 mt-2">
                ⚠️ Você está gastando mais do que ganha neste mês.
              </div>
            )}
          </div>

          {/* Info extra */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Gastos por categoria
          </h3>
          {resumo.porCategoria.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma categoria cadastrada.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {resumo.porCategoria.map((c) => {
                const pct = resumo.total > 0 ? (c.total / resumo.total) * 100 : 0;
                return (
                  <div
                    key={c.id}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="flex items-center gap-2 font-medium text-gray-900">
                        <span
                          className="w-3 h-3 rounded"
                          style={{ background: c.cor }}
                        />
                        {c.nome}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatarValor(c.total)}{' '}
                        <span className="text-gray-400 text-xs font-normal">
                          ({c.quantidade}x)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: c.cor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Evolução */}
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Últimos 6 meses (despesas)
          </h3>
          {resumo.evolucao.length === 0 ? (
            <p className="text-gray-500 text-sm">Sem dados nos últimos 6 meses.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {resumo.evolucao.map((e) => (
                <div
                  key={e.mes}
                  className={`flex justify-between px-4 py-3 ${
                    e.mes === mes ? 'text-blue-600 font-bold' : 'text-gray-700'
                  }`}
                >
                  <span>{formatarMes(e.mes)}</span>
                  <span>{formatarValor(e.total)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ titulo, valor, corTexto = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-1">{titulo}</div>
      <div className={`text-2xl font-bold ${corTexto}`}>{valor}</div>
    </div>
  );
}