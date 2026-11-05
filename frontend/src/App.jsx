import { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import {
  BarChart3, ChevronRight, CircleDollarSign, CreditCard,
  LayoutDashboard, LogIn, Menu, PiggyBank, Tags, WalletCards, X,
} from 'lucide-react';
import Categorias from './Categorias';
import Despesas from './Despesas';
import Dashboard from './Dashboard';
import Rendas from './Rendas';
import GastosFixos from './GastosFixos';

const ABAS = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'despesas', label: 'Despesas', icon: CreditCard },
  { id: 'gastos-fixos', label: 'Gastos fixos', icon: BarChart3 },
  { id: 'rendas', label: 'Renda', icon: PiggyBank },
  { id: 'categorias', label: 'Categorias', icon: Tags },
];

export default function App() {
  const [aba, setAba] = useState('dashboard');
  const [menuAberto, setMenuAberto] = useState(false);

  function selecionarAba(id) {
    setAba(id);
    setMenuAberto(false);
  }

  return (
    <div className="app-shell">
      <Show when="signed-out">
        <div className="landing-page">
          <div className="landing-orb landing-orb-one" /><div className="landing-orb landing-orb-two" />
          <header className="landing-header">
            <div className="brand-mark"><CircleDollarSign size={22} /></div>
            <span>Meu<span>Bolso</span></span>
            <SignInButton mode="modal"><button className="button button-ghost">Entrar <LogIn size={16} /></button></SignInButton>
          </header>
          <main className="landing-content">
            <div className="eyebrow"><span /> ORGANIZE. PLANEJE. VIVA.</div>
            <h1>Seu dinheiro,<br /><em>no controle.</em></h1>
            <p>Uma visão clara das suas finanças para você tomar decisões melhores todos os meses.</p>
            <SignInButton mode="modal"><button className="button button-primary button-large">Começar agora <ChevronRight size={18} /></button></SignInButton>
            <div className="landing-proof"><div className="proof-avatars"><span>✓</span><span>✓</span><span>✓</span></div><span>Feito para deixar sua vida mais leve</span></div>
          </main>
          <div className="landing-card">
            <div className="mock-card-header"><span>Saldo disponível</span><CircleDollarSign size={18} /></div>
            <strong>R$ 4.280,50</strong>
            <div className="mock-chart"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="mock-card-footer"><span>+12,8% este mês</span><span>↗</span></div>
          </div>
        </div>
      </Show>

      <Show when="signed-in">
        <button className="mobile-menu-button" onClick={() => setMenuAberto((aberto) => !aberto)} aria-label="Abrir menu">
          {menuAberto ? <X size={21} /> : <Menu size={21} />}
        </button>
        <aside className={`sidebar ${menuAberto ? 'sidebar-open' : ''}`}>
          <div className="sidebar-brand"><div className="brand-mark"><CircleDollarSign size={21} /></div><span>Meu<span>Bolso</span></span></div>
          <div className="sidebar-label">MENU PRINCIPAL</div>
          <nav className="sidebar-nav">
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => selecionarAba(a.id)}
                className={`sidebar-link ${aba === a.id ? 'sidebar-link-active' : ''}`}
              >
                <a.icon size={18} strokeWidth={aba === a.id ? 2.4 : 2} /><span>{a.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom"><div className="sidebar-tip"><WalletCards size={18} /><span>Cuide bem do<br /><b>seu futuro.</b></span></div><Show when="signed-in"><UserButton afterSignOutUrl="/" /></Show></div>
        </aside>
        <div className="main-area">
          <header className="topbar"><div><span className="topbar-overline">MEU ESPAÇO FINANCEIRO</span><h1>{ABAS.find((a) => a.id === aba)?.label}</h1></div><div className="topbar-user"><span className="topbar-date">Hoje, {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date())}</span><Show when="signed-in"><UserButton afterSignOutUrl="/" /></Show></div></header>
          <main className="content-area">
            {aba === 'dashboard' && <Dashboard />}{aba === 'despesas' && <Despesas />}{aba === 'gastos-fixos' && <GastosFixos />}{aba === 'rendas' && <Rendas />}{aba === 'categorias' && <Categorias />}
          </main>
        </div>
      </Show>
    </div>
  );
}