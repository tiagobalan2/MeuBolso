import { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import Categorias from './Categorias';
import Despesas from './Despesas';

export default function App() {
  const [aba, setAba] = useState('categorias');

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
        <nav style={{ display: 'flex', gap: 8, margin: '20px 0', borderBottom: '1px solid #ddd' }}>
          <button
            onClick={() => setAba('categorias')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: aba === 'categorias' ? '3px solid #3B82F6' : '3px solid transparent',
              fontWeight: aba === 'categorias' ? 'bold' : 'normal',
              color: aba === 'categorias' ? '#3B82F6' : '#555',
            }}
          >
            Categorias
          </button>
          <button
            onClick={() => setAba('despesas')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: aba === 'despesas' ? '3px solid #3B82F6' : '3px solid transparent',
              fontWeight: aba === 'despesas' ? 'bold' : 'normal',
              color: aba === 'despesas' ? '#3B82F6' : '#555',
            }}
          >
            Despesas
          </button>
        </nav>

        {aba === 'categorias' && <Categorias />}
        {aba === 'despesas' && <Despesas />}
      </Show>
    </div>
  );
}