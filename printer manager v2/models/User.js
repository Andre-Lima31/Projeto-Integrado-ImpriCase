// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt        = require('bcryptjs');
const sequelize     = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 100] }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'E-mail já cadastrado.' },
    validate: { isEmail: { msg: 'E-mail inválido.' } }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  perfil: {
    type: DataTypes.ENUM('admin', 'operador', 'visualizador'),
    defaultValue: 'operador'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    // Hash da senha antes de criar/atualizar
    beforeCreate: async (user) => {
      if (user.senha) user.senha = await bcrypt.hash(user.senha, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('senha')) user.senha = await bcrypt.hash(user.senha, 12);
    }
  }
});

// Método de instância: comparar senha
User.prototype.verificarSenha = async function(senhaTexto) {
  return bcrypt.compare(senhaTexto, this.senha);
};

// Método estático: buscar sem expor a senha
User.findSafe = async (id) => {
  return User.findByPk(id, {
    attributes: { exclude: ['senha'] }
  });
};

module.exports = User;
