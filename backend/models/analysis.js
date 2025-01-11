const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Analysis = sequelize.define('Analysis', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    songTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    artist: DataTypes.STRING,
    album: DataTypes.STRING,
    key: DataTypes.STRING,
    tempo: DataTypes.STRING,
    tones: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  });

  return Analysis;
}; 