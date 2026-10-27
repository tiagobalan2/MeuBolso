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

    // Se não vier mês, usa o mês atual
    const mesRef = mes || new Date().toISOString().slice(0, 7);
    const dataInicio = `${mesRef}-01`;

    // 1) Totais gerais do mês
    const totalMesQuery = await query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(10,2) AS total,
              COUNT(*) AS quantidade
       FROM despesa
       WHERE usuario_id = $1
         AND data >= $2::date
         AND data < ($2::date + INTERVAL '1 month')`,
      [req.userId, dataInicio]
    );

    // 2) Totais por categoria no mês
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

    // 3) Últimos 6 meses
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

    res.json({
      mes: mesRef,
      total: Number(totalMesQuery.rows[0].total),
      quantidade: Number(totalMesQuery.rows[0].quantidade),
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