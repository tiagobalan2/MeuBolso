import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { query } from '../db.js';

const router = Router();

function requireAuth(req, res, next) {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  req.userId = userId;
  next();
}

// GET /api/dashboard/resumo?mes=2026-10
router.get('/resumo', requireAuth, async (req, res, next) => {
  try {
    const { mes } = req.query;
    const mesRef = mes || new Date().toISOString().slice(0, 7);
    const dataInicio = `${mesRef}-01`;

    // 1) Despesas do mês (total, quantidade, por categoria)
    const totalMesQuery = await query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(10,2) AS total,
              COUNT(*) AS quantidade
       FROM despesa
       WHERE usuario_id = $1
         AND data >= $2::date
         AND data < ($2::date + INTERVAL '1 month')`,
      [req.userId, dataInicio]
    );

    const porCategoriaQuery = await query(
      `SELECT c.id, c.nome, c.cor,
              COALESCE(SUM(d.valor), 0)::numeric(10,2) AS total,
              COUNT(d.id) AS quantidade
       FROM categoria c
       LEFT JOIN despesa d
         ON d.categoria_id = c.id
        AND d.data >= $2::date
        AND d.data < ($2::date + INTERVAL '1 month')
       WHERE c.usuario_id = $1
       GROUP BY c.id, c.nome, c.cor
       ORDER BY total DESC`,
      [req.userId, dataInicio]
    );

    // 2) Renda total do mês
    const rendaQuery = await query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(10,2) AS total,
              COUNT(*) AS quantidade
       FROM renda
       WHERE usuario_id = $1 AND mes = $2::date`,
      [req.userId, dataInicio]
    );

    // 3) Gastos fixos ativos
    const gastosFixosQuery = await query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(10,2) AS total,
              COUNT(*) AS quantidade
       FROM gasto_fixo
       WHERE usuario_id = $1 AND ativo = TRUE`,
      [req.userId]
    );

    // 4) Evolução dos últimos 6 meses (só despesas)
    const evolucaoQuery = await query(
      `SELECT to_char(date_trunc('month', data), 'YYYY-MM') AS mes,
              SUM(valor)::numeric(10,2) AS total
       FROM despesa
       WHERE usuario_id = $1
         AND data >= (date_trunc('month', $2::date) - INTERVAL '5 months')
       GROUP BY 1
       ORDER BY 1`,
      [req.userId, dataInicio]
    );

    const totalDespesas = Number(totalMesQuery.rows[0].total);
    const totalRenda = Number(rendaQuery.rows[0].total);
    const totalGastosFixos = Number(gastosFixosQuery.rows[0].total);
    const saldo = totalRenda - totalGastosFixos - totalDespesas;

    res.json({
      mes: mesRef,
      total: totalDespesas,
      quantidade: Number(totalMesQuery.rows[0].quantidade),
      renda: {
        total: totalRenda,
        quantidade: Number(rendaQuery.rows[0].quantidade),
      },
      gastosFixos: {
        total: totalGastosFixos,
        quantidade: Number(gastosFixosQuery.rows[0].quantidade),
      },
      saldo,
      porCategoria: porCategoriaQuery.rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        cor: r.cor,
        total: Number(r.total),
        quantidade: Number(r.quantidade),
      })),
      evolucao: evolucaoQuery.rows.map((r) => ({
        mes: r.mes,
        total: Number(r.total),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;