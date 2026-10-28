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

// GET /api/gastos-fixos?ativo=true
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ativo } = req.query;
    const conditions = ['usuario_id = $1'];
    const params = [req.userId];

    if (ativo !== undefined) {
      params.push(ativo === 'true');
      conditions.push(`ativo = $${params.length}`);
    }

    const { rows } = await query(
      `SELECT id, descricao, valor, dia_vencimento, ativo, criado_em
       FROM gasto_fixo
       WHERE ${conditions.join(' AND ')}
       ORDER BY ativo DESC, descricao`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/gastos-fixos
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { descricao, valor, dia_vencimento } = req.body;

    if (!descricao || !valor) {
      return res.status(400).json({
        error: 'descricao e valor são obrigatórios',
      });
    }

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ error: 'valor deve ser maior que zero' });
    }

    let diaNum = null;
    if (dia_vencimento !== undefined && dia_vencimento !== null && dia_vencimento !== '') {
      diaNum = Number(dia_vencimento);
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        return res.status(400).json({ error: 'dia_vencimento deve ser entre 1 e 31' });
      }
    }

    const { rows } = await query(
      `INSERT INTO gasto_fixo (descricao, valor, dia_vencimento, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, descricao, valor, dia_vencimento, ativo, criado_em`,
      [descricao.trim(), valorNum, diaNum, req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/gastos-fixos/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { descricao, valor, dia_vencimento, ativo } = req.body;

    let valorNum;
    if (valor !== undefined) {
      valorNum = Number(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({ error: 'valor deve ser maior que zero' });
      }
    }

    let diaNum;
    if (dia_vencimento !== undefined) {
      if (dia_vencimento === null || dia_vencimento === '') {
        diaNum = null;
      } else {
        diaNum = Number(dia_vencimento);
        if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
          return res.status(400).json({ error: 'dia_vencimento deve ser entre 1 e 31' });
        }
      }
    }

    const { rows } = await query(
      `UPDATE gasto_fixo
       SET descricao = COALESCE($1, descricao),
           valor = COALESCE($2, valor),
           dia_vencimento = CASE WHEN $3::int IS NOT NULL THEN $3 ELSE dia_vencimento END,
           ativo = COALESCE($4, ativo)
       WHERE id = $5 AND usuario_id = $6
       RETURNING id, descricao, valor, dia_vencimento, ativo, criado_em`,
      [descricao, valorNum, diaNum, ativo, id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/gastos-fixos/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      'DELETE FROM gasto_fixo WHERE id = $1 AND usuario_id = $2',
      [id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;