import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { query } from '../db.js';

const router = Router();

// Middleware local: exige usuário autenticado
function requireAuth(req, res, next) {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  req.userId = userId;
  next();
}

// GET /api/categorias — listar categorias do usuário
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, nome, cor, icone FROM categoria WHERE usuario_id = $1 ORDER BY nome',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/categorias — criar
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { nome, cor = '#888888', icone = null } = req.body;

    if (!nome || nome.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const { rows } = await query(
      `INSERT INTO categoria (nome, cor, icone, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, cor, icone`,
      [nome.trim(), cor, icone, req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma categoria com esse nome' });
    }
    next(err);
  }
});

// PUT /api/categorias/:id — editar
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cor, icone } = req.body;

    const { rows } = await query(
      `UPDATE categoria
       SET nome = COALESCE($1, nome),
           cor = COALESCE($2, cor),
           icone = COALESCE($3, icone)
       WHERE id = $4 AND usuario_id = $5
       RETURNING id, nome, cor, icone`,
      [nome, cor, icone, id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categorias/:id — excluir
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(
      'DELETE FROM categoria WHERE id = $1 AND usuario_id = $2',
      [id, req.userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Não é possível excluir: existem despesas vinculadas a esta categoria',
      });
    }
    next(err);
  }
});

export default router;