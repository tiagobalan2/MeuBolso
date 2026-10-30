import { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import Categorias from './Categorias';
import Despesas from './Despesas';
import Dashboard from './Dashboard';
import Rendas from './Rendas';
import GastosFixos from './GastosFixos';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'gastos-fixos', label: 'Gastos fixos' },
  { id: 'rendas', label: 'Renda' },
  { id: 'categorias', label: 'Categorias' },
];

export default function App() {
  const [aba, setAba] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            💰 MeuBolso
          </h1>

          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition">
                Entrar
              </button>
            </SignInButton>
          </Show>
        </div>
      </header>

      {/* Conteúdo */}
      <Show when="signed-out">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Controle suas despesas de forma simples
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Registre seus gastos, acompanhe o saldo do mês e descubra para onde
            seu dinheiro está indo.
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition">
              Começar agora
            </button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="max-w-5xl mx-auto px-4">
          {/* Abas */}
          <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  aba === a.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {a.label}
              </button>
            ))}
          </nav>

          {/* Conteúdo da aba */}
          <main className="pb-16">
            {aba === 'dashboard' && <Dashboard />}
            {aba === 'despesas' && <Despesas />}
            {aba === 'gastos-fixos' && <GastosFixos />}
            {aba === 'rendas' && <Rendas />}
            {aba === 'categorias' && <Categorias />}
          </main>
        </div>
      </Show>
    </div>
  );
}