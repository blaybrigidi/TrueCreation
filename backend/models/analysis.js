const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Analysis extends Model {
    static associate(models) {
      Analysis.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Analysis.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sourceType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'file_upload'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Analysis',
    tableName: 'Analyses',
    underscored: true
  });

  return Analysis;
}; 