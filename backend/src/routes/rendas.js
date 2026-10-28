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

// GET /api/rendas?mes=2026-10
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { mes } = req.query;
    const conditions = ['usuario_id = $1'];
    const params = [req.userId];

    if (mes) {
      params.push(`${mes}-01`);
      conditions.push(`mes = $${params.length}::date`);
    }

    const { rows } = await query(
      `SELECT id, descricao, valor, mes, criado_em
       FROM renda
       WHERE ${conditions.join(' AND ')}
       ORDER BY mes DESC, criado_em DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/rendas
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { descricao, valor, mes } = req.body;

    if (!descricao || !valor || !mes) {
      return res.status(400).json({
        error: 'descricao, valor e mes são obrigatórios',
      });
    }

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ error: 'valor deve ser maior que zero' });
    }

    // Normaliza o mês para o dia 1 (aceita "2026-10" ou "2026-10-15")
    const mesNormalizado = `${mes.slice(0, 7)}-01`;

    const { rows } = await query(
      `INSERT INTO renda (descricao, valor, mes, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, descricao, valor, mes, criado_em`,
      [descricao.trim(), valorNum, mesNormalizado, req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/rendas/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { descricao, valor, mes } = req.body;

    let valorNum;
    if (valor !== undefined) {
      valorNum = Number(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({ error: 'valor deve ser maior que zero' });
      }
    }

    let mesNormalizado;
    if (mes) {
      mesNormalizado = `${mes.slice(0, 7)}-01`;
    }

    const { rows } = await query(
      `UPDATE renda
       SET descricao = COALESCE($1, descricao),
           valor = COALESCE($2, valor),
           mes = COALESCE($3, mes)
       WHERE id = $4 AND usuario_id = $5
       RETURNING id, descricao, valor, mes, criado_em`,
      [descricao, valorNum, mesNormalizado, id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Renda não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/rendas/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      'DELETE FROM renda WHERE id = $1 AND usuario_id = $2',
      [id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Renda não encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;