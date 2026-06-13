// routes/auth.js
const express   = require('express');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/cadastro ──────────────────────────────────────────
router.post('/cadastro', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 2 }).withMessage('Nome muito curto.'),
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
  body('confirmarSenha').custom((val, { req }) => {
    if (val !== req.body.senha) throw new Error('Senhas não conferem.');
    return true;
  })
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(422).json({ error: erros.array()[0].msg });
  }

  try {
    const { nome, email, senha } = req.body;

    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const user = await User.create({ nome, email, senha, perfil: 'operador' });

    // Loga automaticamente após cadastro
    req.session.userId = user.id;
    req.session.nome   = user.nome;
    req.session.email  = user.email;
    req.session.perfil = user.perfil;

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }
    });
  } catch (err) {
    console.error('[CADASTRO]', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────
router.post('/login', [
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('senha').notEmpty().withMessage('Senha é obrigatória.')
], async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(422).json({ error: erros.array()[0].msg });
  }

  try {
    const { email, senha } = req.body;

    const user = await User.findOne({ where: { email, ativo: true } });
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const senhaOk = await user.verificarSenha(senha);
    if (!senhaOk) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    req.session.userId = user.id;
    req.session.nome   = user.nome;
    req.session.email  = user.email;
    req.session.perfil = user.perfil;

    return res.json({
      message: 'Login realizado!',
      user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('printos.sid');
    res.json({ message: 'Logout realizado.' });
  });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findSafe(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
