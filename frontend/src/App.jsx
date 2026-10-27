import { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import Categorias from './Categorias';
import Despesas from './Despesas';
import Dashboard from './Dashboard';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'categorias', label: 'Categorias' },
];

export default function App() {
  const [aba, setAba] = useState('dashboard');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>💰 MeuBolso</h1>

        <Show when="signed-in">
          <UserButton afterSignOutUrl="/" />
        </Show>

        <Show when="signed-out">
          <SignInButton mode="modal" />
        </Show>
      </header>

      <Show when="signed-out">
        <p>Faça login para começar a controlar suas despesas.</p>
      </Show>

      <Show when="signed-in">
        <nav
          style={{
            display: 'flex',
            gap: 8,
            margin: '20px 0',
            borderBottom: '1px solid #ddd',
          }}
        >
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom:
                  aba === a.id ? '3px solid #3B82F6' : '3px solid transparent',
                fontWeight: aba === a.id ? 'bold' : 'normal',
                color: aba === a.id ? '#3B82F6' : '#555',
              }}
            >
              {a.label}
            </button>
          ))}
        </nav>

        {aba === 'dashboard' && <Dashboard />}
        {aba === 'despesas' && <Despesas />}
        {aba === 'categorias' && <Categorias />}
      </Show>
    </div>
  );
}