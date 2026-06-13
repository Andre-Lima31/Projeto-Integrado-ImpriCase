// routes/users.js  — CRUD completo de usuários (admin)
const express   = require('express');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
// Todas as rotas exigem login; rotas de escrita exigem admin
router.use(requireAuth);

const safe = { attributes: { exclude: ['senha'] } };

// ── GET /api/users — listar todos ───────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ ...safe, order: [['criado_em', 'DESC']] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// ── GET /api/users/:id — buscar um ──────────────────────────────────
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, safe);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

// ── POST /api/users — criar (admin cria outros usuários) ─────────────
router.post('/', requireAdmin, [
  body('nome').trim().notEmpty().withMessage('Nome obrigatório.'),
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('senha').isLength({ min: 6 }).withMessage('Senha mínima: 6 caracteres.'),
  body('perfil').optional().isIn(['admin','operador','visualizador']).withMessage('Perfil inválido.')
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ error: erros.array()[0].msg });

  try {
    const { nome, email, senha, perfil } = req.body;
    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const user = await User.create({ nome, email, senha, perfil: perfil || 'operador' });
    const { senha: _, ...userData } = user.toJSON();
    res.status(201).json({ message: 'Usuário criado.', user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// ── PUT /api/users/:id — atualizar ──────────────────────────────────
router.put('/:id', requireAdmin, [
  body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio.'),
  body('email').optional().trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('senha').optional().isLength({ min: 6 }).withMessage('Senha mínima: 6 caracteres.'),
  body('perfil').optional().isIn(['admin','operador','visualizador']),
  body('ativo').optional().isBoolean()
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ error: erros.array()[0].msg });

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const { nome, email, senha, perfil, ativo } = req.body;
    if (nome  !== undefined) user.nome   = nome;
    if (email !== undefined) user.email  = email;
    if (senha !== undefined) user.senha  = senha;   // hook faz o hash
    if (perfil!== undefined) user.perfil = perfil;
    if (ativo !== undefined) user.ativo  = ativo;

    await user.save();
    const { senha: _, ...userData } = user.toJSON();
    res.json({ message: 'Usuário atualizado.', user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// ── DELETE /api/users/:id — remover ─────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Proteção: não deixar admin remover a si mesmo
    if (parseInt(req.params.id) === req.session.userId) {
      return res.status(400).json({ error: 'Você não pode remover sua própria conta.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    await user.destroy();
    res.json({ message: 'Usuário removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

module.exports = router;
