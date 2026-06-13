// middleware/auth.js

// Verifica se o usuário está logado na sessão
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Não autenticado. Faça login.' });
}

// Verifica se tem perfil admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.perfil === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acesso restrito a administradores.' });
}

module.exports = { requireAuth, requireAdmin };
