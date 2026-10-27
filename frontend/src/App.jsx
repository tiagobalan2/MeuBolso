import { Show, SignInButton, UserButton } from '@clerk/react';
import Categorias from './Categorias';

export default function App() {
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
        <Categorias />
      </Show>
    </div>
  );
}