const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Block extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }

  Block.init({
    height: DataTypes.INTEGER,
    keyHash: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    timestamp: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Block',
  });
  return Block;
};
