const { Sequelize } = require('sequelize');
const config = require('../config/config');
const User = require('./userModel');
const Token = require('./tokenModel');
const Analysis = require('./analysis');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false
  }
);

const models = {
  User: User(sequelize, Sequelize.DataTypes),
  Token: Token(sequelize, Sequelize.DataTypes),
  Analysis: Analysis(sequelize, Sequelize.DataTypes)
};

// Run associations if they exist
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
}; 