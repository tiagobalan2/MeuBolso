import express from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import './db.js';
import categoriasRouter from './routes/categorias.js';
import despesasRouter from './routes/despesas.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares base
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Rota pública de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'meubolso-api' });
});

// Rota protegida de teste
app.get('/api/me', (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({ userId, message: 'Você está logado no MeuBolso!' });
});

// Rotas de categorias
app.use('/api/categorias', categoriasRouter);
app.use('/api/despesas', despesasRouter);
app.use('/api/dashboard', dashboardRouter);


// Handler de erro (deve ser o último)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`💰 MeuBolso API rodando em http://localhost:${PORT}`);
});