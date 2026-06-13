// server.js — PrintOS Backend
const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const path     = require('path');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const sequelize  = require('./config/database');
const User       = require('./models/User');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Sessão armazenada no MySQL ────────────────────────────────────────
const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'sessoes' });

app.use(session({
  name:   'printos.sid',
  secret: process.env.SESSION_SECRET || 'printos_secret_2026_mude_em_producao',
  store:  sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   false,          // true em produção com HTTPS
    maxAge:   8 * 60 * 60 * 1000  // 8 horas
  }
}));

// ── Middlewares gerais ────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas da API ──────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    versao: '2.4.1',
    autenticado: !!(req.session && req.session.userId),
    usuario: req.session?.nome || null
  });
});

// Todas as outras rotas servem o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Inicialização ─────────────────────────────────────────────────────
async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅  MySQL conectado com sucesso.');

    // Sincroniza tabelas (cria se não existir)
    await sequelize.sync({ alter: true });
    sessionStore.sync();
    console.log('✅  Tabelas sincronizadas.');

    // Cria admin padrão se não existir
    const adminExiste = await User.findOne({ where: { email: 'admin@printos.com' } });
    if (!adminExiste) {
      await User.create({
        nome:   'Administrador',
        email:  'admin@printos.com',
        senha:  'admin123',
        perfil: 'admin'
      });
      console.log('✅  Admin padrão criado: admin@printos.com / admin123');
    }

    app.listen(PORT, () => {
      console.log(`\n🖨️  PrintOS rodando em http://localhost:${PORT}`);
      console.log(`   Acesse e faça login com admin@printos.com / admin123\n`);
    });
  } catch (err) {
    console.error('❌  Erro ao iniciar:', err.message);
    process.exit(1);
  }
}

iniciar();
