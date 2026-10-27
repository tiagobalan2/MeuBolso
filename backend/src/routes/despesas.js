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

// GET /api/despesas?mes=2026-10&categoria_id=xxx
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { mes, categoria_id } = req.query;
    const conditions = ['d.usuario_id = $1'];
    const params = [req.userId];

    if (mes) {
      // mes no formato YYYY-MM
      params.push(`${mes}-01`);
      conditions.push(`d.data >= $${params.length}::date`);
      conditions.push(`d.data < ($${params.length}::date + INTERVAL '1 month')`);
    }

    if (categoria_id) {
      params.push(categoria_id);
      conditions.push(`d.categoria_id = $${params.length}`);
    }

    const { rows } = await query(
      `SELECT d.id, d.descricao, d.valor, d.data, d.categoria_id,
              c.nome AS categoria_nome, c.cor AS categoria_cor
       FROM despesa d
       JOIN categoria c ON c.id = d.categoria_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.data DESC, d.criado_em DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/despesas
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { descricao, valor, data, categoria_id } = req.body;

    if (!descricao || !valor || !data || !categoria_id) {
      return res.status(400).json({
        error: 'descricao, valor, data e categoria_id são obrigatórios',
      });
    }

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ error: 'valor deve ser maior que zero' });
    }

    // Garante que a categoria pertence ao usuário
    const cat = await query(
      'SELECT id FROM categoria WHERE id = $1 AND usuario_id = $2',
      [categoria_id, req.userId]
    );
    if (cat.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const { rows } = await query(
      `INSERT INTO despesa (descricao, valor, data, categoria_id, usuario_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, descricao, valor, data, categoria_id`,
      [descricao.trim(), valorNum, data, categoria_id, req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/despesas/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { descricao, valor, data, categoria_id } = req.body;

    if (valor !== undefined) {
      const valorNum = Number(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({ error: 'valor deve ser maior que zero' });
      }
    }

    if (categoria_id) {
      const cat = await query(
        'SELECT id FROM categoria WHERE id = $1 AND usuario_id = $2',
        [categoria_id, req.userId]
      );
      if (cat.rows.length === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
    }

    const { rows } = await query(
      `UPDATE despesa
       SET descricao = COALESCE($1, descricao),
           valor = COALESCE($2, valor),
           data = COALESCE($3, data),
           categoria_id = COALESCE($4, categoria_id)
       WHERE id = $5 AND usuario_id = $6
       RETURNING id, descricao, valor, data, categoria_id`,
      [descricao, valor, data, categoria_id, id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/despesas/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      'DELETE FROM despesa WHERE id = $1 AND usuario_id = $2',
      [id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;