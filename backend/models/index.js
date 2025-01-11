const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false
});

const User = require('./userModel')(sequelize);
const Token = require('./tokenModel')(sequelize);
const Analysis = require('./analysis')(sequelize);

// Set up associations
User.hasMany(Analysis);
Analysis.belongsTo(User);

// Token associations
User.hasMany(Token);
Token.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Token,
  Analysis
}; 